#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const templatePath = path.join(projectRoot, '.env.example');
const envPath = path.join(projectRoot, '.env');

if (fs.existsSync(envPath)) {
  console.error('.env already exists; it was not changed. Edit it manually or remove it before running this command.');
  process.exitCode = 1;
} else {
  let template = fs.readFileSync(templatePath, 'utf8');
  const createSecret = () => crypto.randomBytes(48).toString('base64url');

  template = template.replace(
    'JWT_SECRET_KEY=replace-with-a-strong-secret',
    `JWT_SECRET_KEY=${createSecret()}`,
  );
  template = template.replace(
    'JWT_REFRESH_SECRET_KEY=replace-with-a-strong-secret',
    `JWT_REFRESH_SECRET_KEY=${createSecret()}`,
  );

  fs.writeFileSync(envPath, template, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  console.log('Created .env with newly generated JWT secrets. Fill in database and OAuth values before starting the API.');
}
