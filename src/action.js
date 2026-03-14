async function loadStats() {
  const response = await chrome.runtime.sendMessage({ type: "GET_STATS" });
  const el = document.getElementById("stats");
  if (!response?.ok) {
    el.textContent = "Failed to load stats";
    return;
  }

  const s = response.stats;
  el.innerHTML = `
    <ul>
      <li>Emails received: <strong>${s.emailsReceived}</strong></li>
      <li>Emails scanned: <strong>${s.emailsScanned}</strong></li>
      <li>URLs detected: <strong>${s.urlsDetected}</strong></li>
      <li>Safe: <strong>${s.safeEmails}</strong></li>
      <li>Suspicious: <strong>${s.suspiciousEmails}</strong></li>
      <li>Malicious: <strong>${s.maliciousEmails}</strong></li>
    </ul>
  `;
}

document.getElementById("openDashboard").addEventListener("click", async () => {
  await chrome.tabs.create({ url: chrome.runtime.getURL("src/dashboard.html") });
});

document.getElementById("openSandbox").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "OPEN_SANDBOX", url: "https://example.com" });
});

loadStats();
