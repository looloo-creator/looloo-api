#!/usr/bin/env node

const childProcess = require('node:child_process');
const dotenv = require('dotenv');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const namespace = process.env.K8S_NAMESPACE || 'looloo';
const secretName = process.env.K8S_SECRET_NAME || 'looloo-api-env';

if (!fs.existsSync(envPath)) {
  console.error('No .env file found. Run npm run env:init, then set the required values.');
  process.exit(1);
}

const parsedEnv = dotenv.parse(fs.readFileSync(envPath));
const assignments = Object.entries(parsedEnv).map(([key, value]) => {
  if (!/^[-._a-zA-Z][-._a-zA-Z0-9]*$/.test(key)) {
    throw new Error(`"${key}" is not a valid Kubernetes Secret key.`);
  }

  if (value.includes('\n') || value.includes('\r')) {
    throw new Error(`"${key}" contains a newline and cannot be supplied through an env file.`);
  }

  return `${key}=${value}`;
});

if (!assignments.length) {
  console.error('.env does not contain any environment-variable assignments.');
  process.exit(1);
}

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'looloo-k8s-secret-'));
const normalizedEnvPath = path.join(tempDirectory, '.env');

try {
  fs.writeFileSync(normalizedEnvPath, `${assignments.join('\n')}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });

  const secretManifest = childProcess.spawnSync(
    'kubectl',
    [
      '--namespace',
      namespace,
      'create',
      'secret',
      'generic',
      secretName,
      `--from-env-file=${normalizedEnvPath}`,
      '--dry-run=client',
      '--output=yaml',
    ],
    { encoding: 'utf8' },
  );

  if (secretManifest.status !== 0) {
    throw new Error(secretManifest.stderr.trim() || 'kubectl could not create the Secret manifest.');
  }

  const applied = childProcess.spawnSync(
    'kubectl',
    ['apply', '--filename=-'],
    { input: secretManifest.stdout, encoding: 'utf8' },
  );

  if (applied.status !== 0) {
    throw new Error(applied.stderr.trim() || 'kubectl could not apply the Secret.');
  }

  process.stdout.write(applied.stdout);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Unable to update the Kubernetes Secret.');
  process.exitCode = 1;
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}
