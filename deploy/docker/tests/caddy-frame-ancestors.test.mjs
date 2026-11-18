// GHSA-cjj3-xcpr-v6hj
//
// caddy-reconfigure.mjs writes APPSMITH_ALLOWED_FRAME_ANCESTORS into the
// Content-Security-Policy header only when the whole value is a list of CSP
// frame-ancestors source expressions. Any other value is replaced by the
// default policy.
//
// The test renders the real Caddyfile with the caddy binary stubbed, so it
// needs no container and no live Caddy. Run it with:
//   node --test deploy/docker/tests/caddy-frame-ancestors.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
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

// Renders the Caddyfile for one configured value. Returns the frame-ancestors
// policy from the header line and the whole Caddyfile text.
function render(frameAncestors) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "frame-ancestors-"));
  try {
    const wwwPath = path.join(tmp, "www");
    fs.mkdirSync(wwwPath, { recursive: true });

    const env = {
      ...process.env,
      TMP: tmp,
      WWW_PATH: wwwPath,
      _APPSMITH_CADDY: "true",
      APPSMITH_CUSTOM_DOMAIN: "",
    };
    delete env.APPSMITH_ALLOWED_FRAME_ANCESTORS;
    if (frameAncestors !== undefined) {
      env.APPSMITH_ALLOWED_FRAME_ANCESTORS = frameAncestors;
    }

    const result = spawnSync("node", [GENERATOR, "--no-finalize-index-html"], {
      encoding: "utf8",
      env,
    });
    assert.equal(
      result.status,
      0,
      `caddy-reconfigure.mjs failed:\n${result.stderr}\n${result.stdout}`,
    );

    const caddyfile = fs.readFileSync(path.join(tmp, "Caddyfile"), "utf8");
    const headerLines = caddyfile
      .split("\n")
      .filter((line) => line.includes("Content-Security-Policy"));
    assert.equal(headerLines.length, 1, "expected one CSP header line");

    const match = headerLines[0].match(
      /^\s*Content-Security-Policy "frame-ancestors (.*)"\s*$/,
    );
    assert.ok(match, `unexpected CSP header line: ${headerLines[0]}`);

    return { policy: match[1], caddyfile, output: result.stderr + result.stdout };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// The policy for an unset value. Editions differ in what follows 'self', so
// the expected values below are built from this render.
const defaultPolicy = render(undefined).policy;
const editionSuffix = defaultPolicy.slice("'self'".length);

const SUPPORTED = [
  ["the self keyword", "'self'", "'self'"],
  ["the none keyword", "'none'", "'none'"],
  ["a keyword in upper case", "'SELF'", "'self'"],
  ["the wildcard", "*", "*"],
  ["a bare host", "example.com", "example.com"],
  ["a host with a scheme", "https://example.com", "https://example.com"],
  ["a wildcard label", "https://*.example.com", "https://*.example.com"],
  ["a port", "example.com:8443", "example.com:8443"],
  ["a wildcard port", "https://example.com:*", "https://example.com:*"],
  ["a path", "https://example.com/apps/", "https://example.com/apps/"],
  [
    "a path with sub-delimiters",
    "https://example.com/apps/team+tools@v1:2/a=b&c",
    "https://example.com/apps/team+tools@v1:2/a=b&c",
  ],
  ["a scheme source", "https:", "https:"],
  ["two sources", "example.com another.com", "example.com another.com"],
  [
    "extra spaces",
    "  example.com   https://another.com  ",
    "example.com https://another.com",
  ],
];

const NOT_A_SOURCE_LIST = [
  ["a brace", "example.com a{b}"],
  ["a double quote", 'example.com" a'],
  ["a backslash", "example.com\\a"],
  ["a dollar sign", "example.com/$a"],
  ["a comma", "example.com,another.com"],
  ["a semicolon", "example.com; another.com"],
  ["a tab", "example.com\tanother.com"],
  ["a line break at the end", "example.com\n"],
  ["a carriage return at the end", "example.com\r"],
  ["a line break between sources", "example.com\nanother.com"],
  ["a Unicode line separator at the end", "example.com\u2028"],
  ["a line break at the start", "\nexample.com"],
  ["a non-ASCII letter in a host", "ex\u00E4mple.com"],
  ["a control character", "example.com\u0007"],
  ["a query string", "https://example.com/?a=b"],
  ["a wildcard inside a host", "https://a.*.example.com"],
  ["none combined with another source", "'none' example.com"],
  ["an unknown keyword", "'unsafe-inline'"],
];

test("GHSA-cjj3-xcpr-v6hj: uses the default frame-ancestors policy when the value is unset or blank", () => {
  assert.ok(defaultPolicy.startsWith("'self'"));
  assert.equal(render("").policy, defaultPolicy);
  assert.equal(render("   ").policy, defaultPolicy);
});

for (const [name, configured, expected] of SUPPORTED) {
  test(`GHSA-cjj3-xcpr-v6hj: keeps a frame-ancestors value with ${name}`, () => {
    assert.equal(render(configured).policy, expected + editionSuffix);
  });
}

for (const [name, configured] of NOT_A_SOURCE_LIST) {
  test(`GHSA-cjj3-xcpr-v6hj: uses the default frame-ancestors policy for a value with ${name}`, () => {
    const { policy, caddyfile, output } = render(configured);
    assert.equal(policy, defaultPolicy);
    assert.ok(
      !caddyfile.includes(configured),
      "the configured value must not be written to the Caddyfile",
    );
    assert.ok(
      !output.includes(configured),
      "the configured value must not be logged",
    );
  });
}
