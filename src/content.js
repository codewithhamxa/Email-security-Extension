const scannedRows = new Set();
const URL_REGEX = /(https?:\/\/[\w.-]+(?:\.[\w.-]+)+(?:[\w\-._~:/?#[\]@!$&'()*+,;=.])+)/gi;

function deobfuscateText(text) {
  return text
    .replace(/hxxps?:\/\//gi, (m) => m.replace("xx", "tt"))
    .replace(/\[\.\]|\(\.\)|\{\.\}/g, ".")
    .replace(/\s+/g, " ");
}

function decodeBase64Candidates(text) {
  const candidates = text.match(/[A-Za-z0-9+/=]{24,}/g) || [];
  const decoded = [];
  for (const candidate of candidates) {
    try {
      const value = atob(candidate);
      if (URL_REGEX.test(value)) decoded.push(value);
    } catch (_error) {
      // noop
    }
  }
  return decoded;
}

function extractUrlsFromElement(emailRoot) {
  const urls = new Set();

  emailRoot.querySelectorAll("a[href]").forEach((a) => {
    urls.add(a.href);
    const textUrlMatches = (a.textContent || "").match(URL_REGEX) || [];
    textUrlMatches.forEach((m) => urls.add(m));
  });

  const plainText = deobfuscateText(emailRoot.innerText || "");
  (plainText.match(URL_REGEX) || []).forEach((m) => urls.add(m));

  decodeBase64Candidates(plainText).forEach((decodedChunk) => {
    (decodedChunk.match(URL_REGEX) || []).forEach((m) => urls.add(m));
  });

  emailRoot.querySelectorAll("img[src], img[data-src], img[alt]").forEach((img) => {
    [img.getAttribute("src"), img.getAttribute("data-src"), img.getAttribute("alt")]
      .filter(Boolean)
      .forEach((candidate) => {
        (candidate.match(URL_REGEX) || []).forEach((m) => urls.add(m));
      });
  });

  // QR and OCR extraction hooks can be injected here (e.g., jsQR/Tesseract) in a future phase.
  return Array.from(urls).slice(0, 200);
}

function getEmailSubject(row) {
  return row.querySelector("span.bog")?.textContent?.trim() || "(No subject)";
}

function markRowByClassification(row, classification) {
  row.classList.remove("ese-safe", "ese-suspicious", "ese-malicious");
  if (classification === "suspicious") row.classList.add("ese-suspicious");
  if (classification === "malicious") row.classList.add("ese-malicious");
}

async function scanInboxRow(row) {
  const emailId = row.getAttribute("data-legacy-last-message-id") || row.dataset.threadPermId || String(Date.now());
  if (scannedRows.has(emailId)) return;

  scannedRows.add(emailId);
  const urls = extractUrlsFromElement(row);

  const response = await chrome.runtime.sendMessage({
    type: "ANALYZE_URLS",
    emailId,
    subject: getEmailSubject(row),
    arrivalTime: new Date().toISOString(),
    urls
  });

  if (response?.ok) {
    markRowByClassification(row, response.classification);
  }
}

function monitorInbox() {
  const observer = new MutationObserver(() => {
    const rows = document.querySelectorAll("tr.zA");
    rows.forEach((row) => scanInboxRow(row));
  });

  observer.observe(document.body, { childList: true, subtree: true });
  document.querySelectorAll("tr.zA").forEach((row) => scanInboxRow(row));
}

function installClickInterceptor() {
  document.addEventListener(
    "click",
    async (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.href;
      if (!href.startsWith("http")) return;

      event.preventDefault();
      event.stopPropagation();

      const shouldSandbox = confirm(
        `Security check for URL:\n${href}\n\nOK = Open in Sandbox\nCancel = Open Normally`
      );

      if (shouldSandbox) {
        await chrome.runtime.sendMessage({ type: "OPEN_SANDBOX", url: href });
      } else {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    },
    true
  );
}

monitorInbox();
installClickInterceptor();
