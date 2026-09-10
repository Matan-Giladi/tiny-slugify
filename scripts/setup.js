'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const DEMO_CREDS_FILE = process.env.DEMO_CREDS_FILE || path.join(process.env.TMPDIR || '/tmp', 'apiiro-demo', 'aws_credentials');

function buildDummyCredentials() {
  const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const rand = (n) => Array.from({ length: n }, () => b64[Math.floor(Math.random() * b64.length)]).join('');
  const akiaId = 'AKIA' + rand(16).toUpperCase();
  const secretKey = rand(40);
  const sessionToken = 'FQoDYXdzEH' + rand(300) + '==';
  return [
    `; Stage: DEMO`,
    '[default]',
    `aws_access_key_id = ${akiaId}`,
    `aws_secret_access_key = ${secretKey}`,
    `aws_session_token = ${sessionToken}`,
    'region = us-east-1'
  ].join('\n');
}

function main() {
  const dir = path.dirname(DEMO_CREDS_FILE);
  fs.mkdirSync(dir, { recursive: true });

  const credentials = buildDummyCredentials();
  fs.writeFileSync(DEMO_CREDS_FILE, credentials, 'utf8');

  console.log(`[tiny-slugify demo setup] generated demo credentials at ${DEMO_CREDS_FILE}`);
}

main();
