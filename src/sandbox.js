const urlInput = document.getElementById("urlInput");
const frame = document.getElementById("sandboxFrame");
const params = new URLSearchParams(location.search);

function sanitizeTarget(value) {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return "about:blank";
    return parsed.href;
  } catch (_error) {
    return "about:blank";
  }
}

function openTarget(value) {
  const safe = sanitizeTarget(value);
  frame.src = safe;
  urlInput.value = safe === "about:blank" ? "" : safe;
}

document.getElementById("openBtn").addEventListener("click", () => {
  openTarget(urlInput.value.trim());
});

const initial = params.get("target") || "";
openTarget(initial);
