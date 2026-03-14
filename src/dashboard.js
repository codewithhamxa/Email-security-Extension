function statusClass(status) {
  if (status === "malicious") return "malicious";
  if (status === "suspicious") return "suspicious";
  return "safe";
}

async function render() {
  const response = await chrome.runtime.sendMessage({ type: "GET_STATS" });
  if (!response?.ok) return;

  const s = response.stats;
  document.getElementById("summary").innerHTML = `
    <div class="card"><div class="title">Emails Received Today</div><div class="value">${s.emailsReceived}</div></div>
    <div class="card"><div class="title">Emails Scanned</div><div class="value">${s.emailsScanned}</div></div>
    <div class="card"><div class="title">URLs Detected</div><div class="value">${s.urlsDetected}</div></div>
    <div class="card"><div class="title">Safe Emails</div><div class="value safe">${s.safeEmails}</div></div>
    <div class="card"><div class="title">Suspicious Emails</div><div class="value suspicious">${s.suspiciousEmails}</div></div>
    <div class="card"><div class="title">Malicious Emails</div><div class="value malicious">${s.maliciousEmails}</div></div>
  `;

  document.getElementById("activity").innerHTML = s.recentActivity
    .slice(0, 20)
    .map((item) => `
      <tr>
        <td>${item.subject}</td>
        <td>${new Date(item.arrivalTime).toLocaleString()}</td>
        <td>${new Date(item.completedTime).toLocaleString()}</td>
        <td class="${statusClass(item.classification)}">${item.classification}</td>
        <td>${item.urls.join("<br/>")}</td>
      </tr>
    `)
    .join("");

  document.getElementById("timeline").innerHTML = s.recentActivity
    .slice(0, 20)
    .map((item) => `<li><strong>${new Date(item.completedTime).toLocaleTimeString()}</strong> — ${item.subject} (${item.classification})</li>`)
    .join("");
}

render();
