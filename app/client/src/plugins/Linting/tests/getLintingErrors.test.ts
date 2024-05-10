import { getScriptType } from "workers/Evaluation/evaluate";
import getLintingErrors from "../utils/getLintingErrors";

describe("getLintingErrors", () => {
  describe("1. Verify lint errors are not shown for supported window APIs", () => {
    const data = {};

    it("1. For fetch API", () => {
      const originalBinding = "{{fetch()}}";
      const script = "fetch()";

      const scriptType = getScriptType(false, true);

      const lintErrors = getLintingErrors({
        data,
        originalBinding,
        script,
        scriptType,
      });

      expect(Array.isArray(lintErrors)).toBe(true);
      expect(lintErrors.length).toEqual(0);
    });
    it("2. For setTimeout", () => {
      const originalBinding = "{{setTimeout()}}";
      const script = "setTimeout()";

      const scriptType = getScriptType(false, true);

      const lintErrors = getLintingErrors({
        data,
        originalBinding,
        script,
        scriptType,
      });

      expect(Array.isArray(lintErrors)).toBe(true);
      expect(lintErrors.length).toEqual(0);
    });
    it("3. For console", () => {
      const originalBinding = "{{console.log()}}";
      const script = "console.log()";

      const scriptType = getScriptType(false, true);

      const lintErrors = getLintingErrors({
        data,
        originalBinding,
        script,
        scriptType,
      });

      expect(lintErrors.length).toEqual(0);
    });
  });

  describe("2. Verify lint errors are shown for unsupported window APIs", () => {
    const data = {};
    it("1. For window", () => {
      const originalBinding = "{{window}}";
      const script = "window";

      const scriptType = getScriptType(false, true);

      const lintErrors = getLintingErrors({
        data,
        originalBinding,
        script,
        scriptType,
      });

      expect(lintErrors.length).toEqual(1);
    });
    it("2. For document", () => {
      const originalBinding = "{{document}}";
      const script = "document";

      const scriptType = getScriptType(false, true);

      const lintErrors = getLintingErrors({
        data,
        originalBinding,
        script,
        scriptType,
      });

      expect(lintErrors.length).toEqual(1);
    });
    it("3. For dom", () => {
      const originalBinding = "{{dom}}";
      const script = "dom";

      const scriptType = getScriptType(false, true);

      const lintErrors = getLintingErrors({
        data,
        originalBinding,
        script,
        scriptType,
      });

      expect(lintErrors.length).toEqual(1);
    });
  });
});
