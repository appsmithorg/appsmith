#!/usr/bin/env node
// Usage: node configure-env.js --KEY=VALUE ...
//
// Merges provided key=value pairs into app/client/playwright/.env.
// Creates the file if it doesn't exist. Preserves existing values
// that aren't explicitly overridden.
//
// Examples:
//   node configure-env.js --PLAYWRIGHT_BASE_URL=https://dp.appsmith.com --USERNAME=a@b.com --PASSWORD=secret
//   node configure-env.js --PW_FLAG_OVERRIDES='{"flag": true}'

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../../../..");
const envFile = path.join(repoRoot, "app/client/playwright/.env");

const newVars = {};
for (const arg of process.argv.slice(2)) {
  const stripped = arg.replace(/^--/, "");
  const eqIdx = stripped.indexOf("=");
  if (eqIdx === -1) continue;
  const key = stripped.slice(0, eqIdx);
  const value = stripped.slice(eqIdx + 1);
  if (key) newVars[key] = value;
}

if (Object.keys(newVars).length === 0) {
  console.error("Error: No variables provided.");
  console.error("Usage: node configure-env.js --KEY=VALUE ...");
  process.exit(1);
}

const existing = new Map();

if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    existing.set(line.slice(0, eqIdx), line.slice(eqIdx + 1));
  }
}

for (const [key, value] of Object.entries(newVars)) {
  existing.set(key, value);
}

fs.mkdirSync(path.dirname(envFile), { recursive: true });

const lines = [];
for (const [key, value] of existing) {
  lines.push(`${key}=${value}`);
}
fs.writeFileSync(envFile, lines.join("\n") + "\n");

console.log(`Wrote ${envFile} with ${existing.size} variable(s):`);
for (const [key, value] of existing) {
  console.log(`  ${key}=${key === "PASSWORD" ? "****" : value}`);
}
