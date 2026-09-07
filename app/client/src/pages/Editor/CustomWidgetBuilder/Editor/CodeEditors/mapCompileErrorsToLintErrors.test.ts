import { getLintAnnotations } from "components/editorComponents/CodeEditor/lintHelpers";
import { DebuggerLogType } from "../../types";
import {
  getLintBindingPrefix,
  LINT_BINDING_PREFIX_LENGTH,
  mapCompileErrorsToLintErrors,
} from "./mapCompileErrorsToLintErrors";

describe("getLintBindingPrefix", () => {
  it("returns a space for empty source", () => {
    expect(getLintBindingPrefix("")).toBe(" ");
  });

  it("returns the full string when shorter than the prefix length", () => {
    const js = "const a = 1;";

    expect(getLintBindingPrefix(js)).toBe(js);
  });

  it("truncates to at most LINT_BINDING_PREFIX_LENGTH", () => {
    const js = "a".repeat(LINT_BINDING_PREFIX_LENGTH + 50);

    expect(getLintBindingPrefix(js).length).toBeLessThanOrEqual(
      LINT_BINDING_PREFIX_LENGTH,
    );
  });

  it("trims a mid-word cut so the prefix still matches at index 0", () => {
    const js =
      'import React from "https://esm.sh/react@18.2.0";\n' +
      "const filler = `" +
      "x".repeat(400) +
      "`;\n";
    const prefix = getLintBindingPrefix(js);

    expect(js.startsWith(prefix)).toBe(true);
    expect(prefix.length).toBeLessThanOrEqual(LINT_BINDING_PREFIX_LENGTH);
    // Must not end mid-run of x's while more x's follow
    expect(prefix.endsWith("x")).toBe(false);
  });
});

describe("mapCompileErrorsToLintErrors", () => {
  const babelError = {
    line: 10,
    column: 4,
    message: "SyntaxError: Unexpected token",
  };

  it("returns an empty array when debuggerLogs is undefined", () => {
    expect(mapCompileErrorsToLintErrors(undefined, "const a = 1;")).toEqual([]);
  });

  it("maps located compile errors with a short binding prefix", () => {
    const largeJs =
      'import React from "https://esm.sh/react@18.2.0";\n' +
      "const filler = `" +
      "x".repeat(40000) +
      "`;\nfunction\n";

    const mapped = mapCompileErrorsToLintErrors(
      [
        {
          type: DebuggerLogType.ERROR,
          args: [babelError],
        },
      ],
      largeJs,
    );

    expect(mapped).toHaveLength(1);
    expect(mapped[0].originalBinding.length).toBeLessThanOrEqual(
      LINT_BINDING_PREFIX_LENGTH,
    );
    expect(mapped[0].originalBinding).not.toEqual(largeJs);
    expect(mapped[0].raw).toEqual(mapped[0].originalBinding);
    expect(mapped[0].errorSegment).toEqual(mapped[0].originalBinding);
    expect(mapped[0].line).toBe(9);
    expect(mapped[0].ch).toBe(6);
  });

  it("does not throw in getLintAnnotations for a large source with a syntax error", () => {
    const largeJs =
      'import React from "https://esm.sh/react@18.2.0";\n' +
      "const filler = `" +
      "x".repeat(40000) +
      "`;\nfunction\n";

    const mapped = mapCompileErrorsToLintErrors(
      [
        {
          type: DebuggerLogType.ERROR,
          args: [{ line: 3, column: 0, message: "Unexpected token" }],
        },
      ],
      largeJs,
    );

    expect(() => getLintAnnotations(largeJs, mapped, {})).not.toThrow();

    const annotations = getLintAnnotations(largeJs, mapped, {});

    expect(annotations.length).toBeGreaterThan(0);
    expect(annotations[0].from?.line).toBe(2);
  });

  it("still produces an annotation for a small default-template sized source", () => {
    const smallJs = `import React from "https://esm.sh/react@18.2.0";
import ReactDOM from "https://esm.sh/react-dom@18.2.0";

function App() {
  return <div>hi</div>;
}

appsmith.onReady(() => {
  ReactDOM.render(<App />, document.getElementById("root"));
});
function
`;

    const mapped = mapCompileErrorsToLintErrors(
      [
        {
          type: DebuggerLogType.ERROR,
          args: [{ line: 11, column: 0, message: "Unexpected token" }],
        },
      ],
      smallJs,
    );

    expect(mapped[0].originalBinding.length).toBeLessThanOrEqual(
      LINT_BINDING_PREFIX_LENGTH,
    );

    const annotations = getLintAnnotations(smallJs, mapped, {});

    expect(annotations.length).toBeGreaterThan(0);
    expect(annotations[0].from?.line).toBe(10);
  });

  it("skips errors without line or column", () => {
    const mapped = mapCompileErrorsToLintErrors(
      [
        {
          type: DebuggerLogType.ERROR,
          args: [{ message: "no location" }],
        },
      ],
      "const a = 1;",
    );

    expect(mapped).toEqual([]);
  });
});
