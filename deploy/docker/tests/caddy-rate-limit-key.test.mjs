// Security regression test for GHSA-qrgm-h8c4-jjf7
//
// Rate Limit Bypass via X-Forwarded-For Header Spoofing.
//
// The Caddy config emitted by caddy-reconfigure.mjs must NOT:
//   1. build the rate-limit bucket key from client-controlled headers
//      ({header.X-Forwarded-For} / {header.Forwarded}); and
//   2. trust every source IP as a proxy (trusted_proxies static 0.0.0.0/0).
//
// If either holds, an unauthenticated attacker varies X-Forwarded-For per
// request to land each request in its own bucket, so the per-bucket counter
// never trips and Caddy's rate limiting (login brute-force / credential
// stuffing / API-flood protection) is fully bypassed.
//
// This test renders the real Caddyfile headlessly (no container, no live Caddy)
// by running the generator with the caddy binary stubbed to a no-op, then
// asserts the security properties on the emitted Caddyfile text. It is designed
// to FAIL on the vulnerable config and PASS after the fix.

import { test, expect, beforeAll } from "vitest";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATOR = path.resolve(
  __dirname,
  "../fs/opt/appsmith/caddy-reconfigure.mjs",
);

let caddyfile = "";
let rateLimitKeyLines = [];
let trustedProxiesLines = [];

beforeAll(() => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ghsa-qrgm-"));
  const wwwPath = path.join(tmp, "www");
  fs.mkdirSync(wwwPath, { recursive: true });

  const result = spawnSync("node", [GENERATOR, "--no-finalize-index-html"], {
    encoding: "utf8",
    env: {
      ...process.env,
      TMP: tmp,
      WWW_PATH: wwwPath,
      // Stub the caddy binary the generator shells out to (`caddy fmt` /
      // `caddy reload`) with a no-op so rendering needs no live Caddy.
      _APPSMITH_CADDY: "true",
      // Rate limiting must be ON for the rate_limit block to be emitted.
      APPSMITH_RATE_LIMIT: "100",
      APPSMITH_CUSTOM_DOMAIN: "",
    },
  });

  if (result.status !== 0) {
    throw new Error(
      `caddy-reconfigure.mjs failed (status ${result.status}):\n${result.stderr}\n${result.stdout}`,
    );
  }

  const caddyfilePath = path.join(tmp, "Caddyfile");
  caddyfile = fs.readFileSync(caddyfilePath, "utf8");

  rateLimitKeyLines = caddyfile.split("\n").filter((l) => /^\s*key\s+/.test(l));
  trustedProxiesLines = caddyfile
    .split("\n")
    .filter((l) => /trusted_proxies/.test(l));
});

test("GHSA-qrgm-h8c4-jjf7: rate-limit key is not built from client-controlled headers", () => {
  // Rate limiting is enabled in this render, so a key line must exist.
  expect(rateLimitKeyLines.length).toBeGreaterThan(0);

  for (const line of rateLimitKeyLines) {
    expect(
      /\{header\.X-Forwarded-For\}/i.test(line),
      `rate-limit key must not use the client-controlled X-Forwarded-For header: ${line.trim()}`,
    ).toBe(false);
    expect(
      /\{header\.Forwarded\}/i.test(line),
      `rate-limit key must not use the client-controlled Forwarded header: ${line.trim()}`,
    ).toBe(false);
  }
});

test("GHSA-qrgm-h8c4-jjf7: Caddy does not trust every source IP as a proxy", () => {
  expect(trustedProxiesLines.length).toBeGreaterThan(0);
  for (const line of trustedProxiesLines) {
    expect(
      /0\.0\.0\.0\/0/.test(line),
      `trusted_proxies must not trust the entire IPv4 space (0.0.0.0/0): ${line.trim()}`,
    ).toBe(false);
  }
});

test("GHSA-qrgm-h8c4-jjf7: rate limiting is still present and keyed on the trusted client IP", () => {
  // Positive assertion so the fix cannot silently disable throttling.
  expect(/rate_limit\s*\{/.test(caddyfile)).toBe(true);
  const keyText = rateLimitKeyLines.join("\n");
  expect(
    /\{client_ip\}/.test(keyText),
    `rate-limit key should be keyed on Caddy's trusted-resolved {client_ip}: ${keyText.trim()}`,
  ).toBe(true);
});
