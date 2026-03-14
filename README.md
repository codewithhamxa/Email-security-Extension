# Email Security Extension (MVP Scaffold)

This repository contains a Chrome Extension scaffold implementing the core system requested for Gmail scanning, URL risk analysis, inbox highlighting, click interception, sandbox browsing, and activity dashboard.

## Implemented Core Capabilities

- Gmail monitoring via content script (`https://mail.google.com/*`).
- Automatic scanning of inbox rows when loaded/updated.
- URL extraction from:
  - Visible links (`<a href>`)
  - Plain/hidden text URL patterns
  - Image attributes (`src`, `data-src`, `alt`) as lightweight embedded-link detection
  - Obfuscated/encoded string patterns (deobfuscation + base64 candidate decoding)
- URL analysis pipeline:
  1. Send extracted URLs to backend API endpoint (`API_ENDPOINT` in `src/background.js`)
  2. Fallback local rule engine if API fails
  3. Classification: `safe`, `suspicious`, `malicious`
- Gmail inbox UI highlighting:
  - Suspicious → Yellow border
  - Malicious → Red border
  - Safe → no visual change
- URL click protection:
  - User prompt to open URL in sandbox vs normal browsing
- Interactive sandbox page:
  - Manual URL input
  - Sandboxed iframe rendering for interactive testing
- Security activity dashboard:
  - Daily stats (received, scanned, URLs)
  - Category summary (safe/suspicious/malicious)
  - Recent activity table
  - Timeline list

## File Map

- `manifest.json` – Extension wiring and permissions.
- `src/content.js` – Gmail DOM monitoring, URL extraction, click interception.
- `src/background.js` – Backend communication, classification, stats storage.
- `src/gmail.css` – Gmail row highlighting styles.
- `src/action.html`, `src/action.js` – Popup quick view and shortcuts.
- `src/dashboard.html`, `src/dashboard.js` – Activity monitoring dashboard.
- `src/sandbox.html`, `src/sandbox.js` – Interactive sandbox browser view.

## Notes on Isolation and Production Hardening

This MVP uses browser-side iframe sandboxing to provide a practical isolated interaction mode. For strict enterprise-grade isolation and guaranteed data non-exfiltration, production architecture should add a remote isolation backend (browser/container virtualization + network policy enforcement + traffic sanitization).

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository folder.
5. Open Gmail and verify row highlighting behavior.
