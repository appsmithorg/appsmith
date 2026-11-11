import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GLOBAL_BINDING_HEADS } from "./lint.js";

// The dangling-binding lint must accept every web API the client's evaluator supports, so a binding such as
// `{{ new Blob(["hi"]).size }}` is not reported as unknown (CodeRabbit on #42540). The list is read from the client
// source, so a new supported API fails this test until lint.ts lists it.
const CLIENT_LINT_CONSTANTS = resolve(
  __dirname,
  "../../../../src/plugins/Linting/constants.ts",
);

function supportedWebApis(): string[] {
  const source = readFileSync(CLIENT_LINT_CONSTANTS, "utf8");
  const block = /export const SUPPORTED_WEB_APIS = \{([^}]*)\}/.exec(source);

  if (!block) throw new Error("SUPPORTED_WEB_APIS was not found");

  return [...block[1].matchAll(/([A-Za-z_$][A-Za-z0-9_$]*)\s*:/g)].map(
    (match) => match[1],
  );
}

describe("dangling-binding globals match the client's supported web APIs", () => {
  it("reads a non-empty list from the client", () => {
    expect(supportedWebApis()).toEqual(
      expect.arrayContaining(["Blob", "File", "FormData", "fetch"]),
    );
  });

  it("accepts every supported web API as a binding head", () => {
    expect(
      supportedWebApis().filter((name) => !GLOBAL_BINDING_HEADS.has(name)),
    ).toEqual([]);
  });
});
