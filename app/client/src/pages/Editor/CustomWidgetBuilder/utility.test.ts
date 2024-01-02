import type { BabelError } from "./utility";
import { compileSrcDoc, getBabelError } from "./utility";

describe("getBabelError", () => {
  it("should return DebuggerLogItem with line, column, and message", () => {
    const babelError = {
      loc: {
        line: 5,
        column: 10,
      },
      toString: () => "Something went wrong",
    };

    const result = getBabelError(babelError as BabelError);

    expect(result).toEqual({
      line: 5,
      column: 10,
      message: "Something went wrong",
    });
  });

  it("should handle undefined loc property", () => {
    const babelError = {
      toString: () => "Something went wrong",
    };

    const result = getBabelError(babelError as BabelError);

    expect(result).toEqual({
      line: undefined,
      column: undefined,
      message: "Something went wrong",
    });
  });

  it("should handle undefined Babel error", () => {
    const result = getBabelError(undefined as unknown as BabelError);

    expect(result).toEqual({
      line: undefined,
      column: undefined,
      message: undefined,
    });
  });
});

describe("compileSrcDoc", () => {
  it("should compile SrcDoc with valid JavaScript", () => {
    const validSrcDoc = {
      html: "<div>Hello World</div>",
      js: "const a = 5;",
      css: "div { color: red; }",
    };

    const result = compileSrcDoc(validSrcDoc);

    expect(result.code).toEqual(validSrcDoc);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("should handle Babel compilation errors", () => {
    const srcDocWithErrors = {
      html: "<div>Hello World</div>",
      js: "const a = 5 )",
      css: "div { color: red; }",
    };

    const result = compileSrcDoc(srcDocWithErrors);

    expect(result.code).toEqual(srcDocWithErrors);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toHaveProperty("line");
    expect(result.errors[0]).toHaveProperty("column");
    expect(result.errors[0]).toHaveProperty("message");
  });
});
