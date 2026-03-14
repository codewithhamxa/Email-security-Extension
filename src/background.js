const API_ENDPOINT = "https://example-security-api.local/analyze";

const defaultStats = {
  date: new Date().toISOString().slice(0, 10),
  emailsReceived: 0,
  emailsScanned: 0,
  urlsDetected: 0,
  safeEmails: 0,
  suspiciousEmails: 0,
  maliciousEmails: 0,
  recentActivity: []
};

async function getStats() {
  const { stats } = await chrome.storage.local.get("stats");
  if (!stats || stats.date !== defaultStats.date) {
    await chrome.storage.local.set({ stats: { ...defaultStats } });
    return { ...defaultStats };
  }
  return stats;
}

async function setStats(stats) {
  await chrome.storage.local.set({ stats });
}

function classifyByRules(urls) {
  return urls.map((url) => {
    const normalized = url.toLowerCase();
    if (/(free-gift|verify-account|login-secure|bit\.ly|tinyurl)/.test(normalized)) {
      return { url, classification: "suspicious", reason: "Suspicious keyword or shortener" };
    }
    if (/(paypa1|micr0soft|credential|bank-update|phish|malware)/.test(normalized)) {
      return { url, classification: "malicious", reason: "Known phishing pattern" };
    }
    return { url, classification: "safe", reason: "No matching risk indicators" };
  });
}

async function analyzeUrls(urls) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls })
    });

    if (!response.ok) throw new Error("API response error");
    const data = await response.json();
    if (Array.isArray(data.results)) return data.results;
    throw new Error("Invalid API response schema");
  } catch (error) {
    return classifyByRules(urls);
  }
}

function summarizeClassification(results) {
  if (results.some((r) => r.classification === "malicious")) return "malicious";
  if (results.some((r) => r.classification === "suspicious")) return "suspicious";
  return "safe";
}

async function recordScan(scanPayload) {
  const stats = await getStats();
  stats.emailsReceived += 1;
  stats.emailsScanned += 1;
  stats.urlsDetected += scanPayload.urls.length;

  if (scanPayload.classification === "malicious") stats.maliciousEmails += 1;
  else if (scanPayload.classification === "suspicious") stats.suspiciousEmails += 1;
  else stats.safeEmails += 1;

  stats.recentActivity.unshift({
    subject: scanPayload.subject || "(No subject)",
    emailId: scanPayload.emailId,
    arrivalTime: scanPayload.arrivalTime,
    completedTime: new Date().toISOString(),
    classification: scanPayload.classification,
    urls: scanPayload.urls
  });

  stats.recentActivity = stats.recentActivity.slice(0, 100);
  await setStats(stats);
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({ stats: { ...defaultStats } });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === "ANALYZE_URLS") {
      const results = await analyzeUrls(message.urls || []);
      const classification = summarizeClassification(results);
      await recordScan({
        emailId: message.emailId,
        subject: message.subject,
        arrivalTime: message.arrivalTime,
        urls: message.urls || [],
        classification
      });
      sendResponse({ ok: true, results, classification });
      return;
    }

    if (message.type === "GET_STATS") {
      const stats = await getStats();
      sendResponse({ ok: true, stats });
      return;
    }

    if (message.type === "OPEN_SANDBOX") {
      const url = `src/sandbox.html?target=${encodeURIComponent(message.url || "")}`;
      await chrome.tabs.create({ url: chrome.runtime.getURL(url) });
      sendResponse({ ok: true });
      return;
    }

    sendResponse({ ok: false, error: "Unknown message type" });
  })();

  return true;
});
