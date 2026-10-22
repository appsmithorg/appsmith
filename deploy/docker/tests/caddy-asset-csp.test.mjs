// Uploaded images (assets and profile photos) are served from the instance
// origin. A stored SVG opened directly must not run script there, so Caddy
// sets a sandbox CSP on those routes itself, replacing whatever the backend
// sent, and keeps the frame-ancestors-only policy for every other route.
//
// This renders the real Caddyfile headlessly (no container, no live Caddy) by
// running the generator with the caddy binary stubbed to a no-op, then asserts
// on the emitted Caddyfile text. It is a local check, as is its shell twin
// caddy-asset-csp-test.sh. route-tests/common/asset-csp.hurl is the CI gate
// and covers the header behaviour against a live Caddy.

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

const SANDBOX_POLICY = "sandbox; default-src 'none'; style-src 'unsafe-inline'";
const IMAGE_PATHS = "/api/v1/assets/* /api/v1/users/photo /api/v1/users/photo/*";

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

test("image-serving routes get the sandbox CSP together with frame-ancestors", () => {
  expect(caddyfile).toContain(`@image-path path ${IMAGE_PATHS}`);
  expect(cspLines()).toContain(
    `Content-Security-Policy "frame-ancestors 'self'; ${SANDBOX_POLICY}"`,
  );
});

test("the frame-ancestors-only CSP does not apply to image-serving routes", () => {
  expect(caddyfile).toContain(`@not-image-path not path ${IMAGE_PATHS}`);
  expect(cspLines()).toContain(`Content-Security-Policy "frame-ancestors 'self'"`);
  // Every CSP line is scoped by one of the two matchers, so the plain policy
  // can never overwrite the image one.
  const unscoped = caddyfile.match(/header\s*\{[^}]*Content-Security-Policy/);
  expect(unscoped, "CSP must not be set in the unscoped header block").toBeNull();
});

test("both CSP header blocks are deferred so they apply after the upstream response", () => {
  const blocks = caddyfile.match(/header\s+@(not-)?image-path\s*\{[^}]*\}/g) ?? [];
  expect(blocks.length).toBe(2);
  for (const block of blocks) {
    expect(block).toMatch(/\bdefer\b/);
  }
});
