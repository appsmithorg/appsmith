// Assets (/api/v1/assets/*) are served from the instance origin. A stored SVG
// opened directly must not run script there, so asset responses carry a
// sandbox CSP. Caddy sets Content-Security-Policy on every response, and that
// must not replace the sandbox policy with a frame-ancestors-only one for assets.
//
// This renders the real Caddyfile headlessly (no container, no live Caddy) by
// running the generator with the caddy binary stubbed to a no-op, then asserts
// on the emitted Caddyfile text. Header behaviour against a live Caddy is
// covered by route-tests/common/asset-csp.hurl.

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

const SANDBOX_POLICY =
  "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'";

let caddyfile = "";

beforeAll(() => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "caddy-asset-csp-"));
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
      APPSMITH_CUSTOM_DOMAIN: "",
      APPSMITH_ALLOWED_FRAME_ANCESTORS: "",
    },
  });

  if (result.status !== 0) {
    throw new Error(
      `caddy-reconfigure.mjs failed (status ${result.status}):\n${result.stderr}\n${result.stdout}`,
    );
  }

  caddyfile = fs.readFileSync(path.join(tmp, "Caddyfile"), "utf8");
});

function cspLines() {
  return caddyfile
    .split("\n")
    .filter((l) => /^\s*Content-Security-Policy\s+/.test(l))
    .map((l) => l.trim());
}

test("asset responses get the sandbox CSP together with frame-ancestors", () => {
  expect(caddyfile).toMatch(/@asset-path\s+path\s+\/api\/v1\/assets\/\*/);
  expect(cspLines()).toContain(
    `Content-Security-Policy "frame-ancestors 'self'; ${SANDBOX_POLICY}"`,
  );
});

test("the frame-ancestors-only CSP does not apply to asset responses", () => {
  expect(caddyfile).toMatch(/@not-asset-path\s+not\s+path\s+\/api\/v1\/assets\/\*/);
  expect(cspLines()).toContain(`Content-Security-Policy "frame-ancestors 'self'"`);
  // Every CSP line is scoped by one of the two matchers, so the plain policy
  // can never overwrite the asset one.
  const unscoped = caddyfile.match(/header\s*\{[^}]*Content-Security-Policy/);
  expect(unscoped, "CSP must not be set in the unscoped header block").toBeNull();
});

test("both CSP header blocks are deferred so they apply after the upstream response", () => {
  const blocks = caddyfile.match(/header\s+@(not-)?asset-path\s*\{[^}]*\}/g) ?? [];
  expect(blocks.length).toBe(2);
  for (const block of blocks) {
    expect(block).toMatch(/\bdefer\b/);
  }
});
