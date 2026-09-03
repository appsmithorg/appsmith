import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LATEST_DSL_VERSION } from "./layout.js";

// The compiler stamps the page DSL version on the root canvas. It MUST equal Appsmith's live LATEST_DSL_VERSION so
// the client's migrateDSL runs zero migrations on load — otherwise it rescales/rewrites our widgets (e.g. flips a
// single-line input to MULTI_LINE_TEXT). We can't import @shared/dsl here (it bundles the whole migration graph), so
// read the constant straight from its source. If Appsmith bumps the version, this test fails and points here.
describe("DSL version stays current with Appsmith", () => {
  it("matches @shared/dsl's LATEST_DSL_VERSION source constant", () => {
    const source = readFileSync(
      resolve(__dirname, "../../../dsl/src/migrate/index.ts"),
      "utf8",
    );
    const match = source.match(/export const LATEST_DSL_VERSION\s*=\s*(\d+)/);

    expect(match).not.toBeNull();
    expect(LATEST_DSL_VERSION).toBe(Number(match![1]));
  });
});
