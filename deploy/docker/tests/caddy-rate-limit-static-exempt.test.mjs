// Regression test for APP-16028
//
// Caddy's per-client-IP rate limit must not count hashed static bundle assets.
//
// A cold editor load fetches well over 100 `/static/js|css/*.chunk.*` files
// within one second. With every request counted against the single
// `dynamic_zone` bucket (default 100 events/s), a single user gets part of the
// bundle rejected with 429. The zone must therefore exclude `/static/*` while
// still counting every path that reaches the Java server or RTS
// (`/api/*`, `/oauth2/*`, `/login/*`, `/rts/*`).
//
// This test renders the real Caddyfile headlessly (no container, no live Caddy)
// by running the generator with the caddy binary stubbed to a no-op, then
// evaluates the zone's `match` block against representative request paths.

import { test, expect, describe } from "vitest";
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

function renderCaddyfile(env) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "app-16028-"));
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
      ...env,
    },
  });

  if (result.status !== 0) {
    throw new Error(
      `caddy-reconfigure.mjs failed (status ${result.status}):\n${result.stderr}\n${result.stdout}`,
    );
  }

  return fs.readFileSync(path.join(tmp, "Caddyfile"), "utf8");
}

// Returns the body of `zone <name> { ... }` inside the rate_limit block.
function extractZone(caddyfile, name) {
  const re = new RegExp(`zone\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\s*\\}\\n\\s*\\}`);
  const m = caddyfile.match(re);
  return m ? m[1] : null;
}

// Returns the `path` / `not path` matcher lines inside the zone's `match { }`.
function extractMatchLines(zoneBody) {
  const m = zoneBody.match(/match\s*\{([\s\S]*?)\n\s*\}/);
  if (!m) return [];
  return m[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"));
}

// Minimal evaluator for the matcher lines we emit: `path <pat>...` and
// `not path <pat>...`, where `*` is Caddy's path wildcard. Returns whether the
// zone counts a request for `requestPath`. A zone with no `match` block counts
// every request.
function zoneCounts(matchLines, requestPath) {
  const globToRegExp = (pat) =>
    new RegExp("^" + pat.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");

  for (const line of matchLines) {
    const tokens = line.split(/\s+/);
    const negated = tokens[0] === "not";
    const [directive, ...patterns] = negated ? tokens.slice(1) : tokens;
    if (directive !== "path") {
      throw new Error(`unsupported matcher in test evaluator: ${line}`);
    }
    const hit = patterns.some((p) => globToRegExp(p).test(requestPath));
    // All matcher lines in a set are ANDed together.
    if (negated ? hit : !hit) return false;
  }
  return true;
}

const STATIC_PATHS = [
  "/static/js/main.3f8a1c2b.chunk.js",
  "/static/css/1234.abcdef12.chunk.css",
  "/static/js/vendors~main.0a1b2c3d.chunk.js",
  "/static/media/logo.svg",
];

const LIMITED_PATHS = [
  "/api/v1/login",
  "/api/v1/users/me",
  "/oauth2/authorization/google",
  "/login/oauth2/code/google",
  "/rts/socket.io/",
  "/",
  "/app/my-app/page-1",
  "/info",
  "/mcp",
];

describe("APP-16028: rate limit exempts hashed static assets", () => {
  const caddyfile = renderCaddyfile({ APPSMITH_RATE_LIMIT: "100" });
  const zone = extractZone(caddyfile, "dynamic_zone");
  const matchLines = zone === null ? [] : extractMatchLines(zone);

  test("dynamic_zone is rendered with a match block that excludes /static/*", () => {
    expect(zone, "rate_limit zone dynamic_zone must be rendered").not.toBeNull();
    expect(matchLines.length, "dynamic_zone must carry a match block").toBeGreaterThan(0);
    expect(matchLines).toContain("not path /static/*");
  });

  test.each(STATIC_PATHS)("static asset %s is not counted", (p) => {
    expect(zoneCounts(matchLines, p)).toBe(false);
  });

  test.each(LIMITED_PATHS)("%s is still counted", (p) => {
    expect(zoneCounts(matchLines, p)).toBe(true);
  });

  test("zone is still keyed on {client_ip} with the configured events per 1s window", () => {
    expect(zone).toMatch(/^\s*key\s+\{client_ip\}\s*$/m);
    expect(zone).toMatch(/^\s*events\s+100\s*$/m);
    expect(zone).toMatch(/^\s*window\s+1s\s*$/m);
  });

  test("backend routes are still proxied (exemption did not touch routing)", () => {
    expect(caddyfile).toMatch(/@backend\s+path\s+\/api\/\*\s+\/oauth2\/\*\s+\/login\/\*/);
    expect(caddyfile).toMatch(/handle\s+\/rts\/\*/);
  });
});

describe("APP-16028: APPSMITH_RATE_LIMIT=disabled semantics are unchanged", () => {
  const caddyfile = renderCaddyfile({ APPSMITH_RATE_LIMIT: "disabled" });

  test("no rate_limit block and no ordering directive are rendered", () => {
    expect(caddyfile).not.toMatch(/rate_limit/);
    expect(caddyfile).not.toMatch(/dynamic_zone/);
  });
});
