import { getScriptType } from "workers/Evaluation/evaluate";
import { CustomLintErrorCode, LINTER_TYPE } from "../constants";
import getLintingErrors from "../utils/getLintingErrors";

const webworkerTelemetry = {};

const linterTypes = [
  { linterType: LINTER_TYPE.JSHINT, name: "JSHint" },
  { linterType: LINTER_TYPE.ESLINT, name: "ESLint" },
];

describe.each(linterTypes)(
  "getLintingErrors with engine $name",
  ({ linterType }) => {
    describe("1. Verify lint errors are not shown for supported window APIs", () => {
      const data = {};

      it("1. For fetch API", () => {
        const originalBinding = "{{fetch()}}";
        const script = "fetch()";

        const scriptType = getScriptType(false, true);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          data,
          originalBinding,
          script,
          scriptType,
          webworkerTelemetry,
        });

        expect(Array.isArray(lintErrors)).toBe(true);
        expect(lintErrors.length).toEqual(0);
      });
      it("2. For setTimeout", () => {
        const originalBinding = "{{setTimeout()}}";
        const script = "setTimeout()";

        const scriptType = getScriptType(false, true);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          webworkerTelemetry,
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
          getLinterTypeFn: () => linterType,
          webworkerTelemetry,
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
          getLinterTypeFn: () => linterType,
          webworkerTelemetry,
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
          getLinterTypeFn: () => linterType,
          webworkerTelemetry,
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
          getLinterTypeFn: () => linterType,
          webworkerTelemetry,
          data,
          originalBinding,
          script,
          scriptType,
        });

        expect(lintErrors.length).toEqual(1);
      });
    });

    describe("3. Verify lint errors are shown when mutations are performed on unmutable objects", () => {
      const data = {
        THIS_CONTEXT: {},
        Input1: {
          text: "inputValue",
          ENTITY_TYPE: "WIDGET",
        },
        appsmith: {
          store: {
            test: "testValue",
          },
        },
      };

      it("1. Assigning values to input widget's properties", () => {
        const originalBinding = "'myFun1() {\n\t\tInput1.text = \"\";\n\t}'";
        const script =
          '\n  function $$closedFn () {\n    const $$result = {myFun1() {\n\t\tInput1.text = "";\n\t}}\n    return $$result\n  }\n  $$closedFn.call(THIS_CONTEXT)\n  ';
        const options = { isJsObject: true };

        const scriptType = getScriptType(false, false);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          webworkerTelemetry,
          data,
          options,
          originalBinding,
          script,
          scriptType,
        });

        expect(lintErrors.length).toEqual(1);
        expect(lintErrors[0].code).toEqual(
          CustomLintErrorCode.INVALID_ENTITY_PROPERTY,
        );
      });

      it("2. Assigning values to appsmith store variables", () => {
        const originalBinding =
          'myFun1() {\n\t\tappsmith.store.test = "";\n\t}';
        const script =
          '\n  function $$closedFn () {\n    const $$result = {myFun1() {\n\t\tappsmith.store.test = "";\n\t}}\n    return $$result\n  }\n  $$closedFn.call(THIS_CONTEXT)\n';
        const options = { isJsObject: true };

        const scriptType = getScriptType(false, false);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          webworkerTelemetry,
          data,
          options,
          originalBinding,
          script,
          scriptType,
        });

        expect(lintErrors.length).toEqual(1);
        expect(lintErrors[0].code).toEqual(
          CustomLintErrorCode.INVALID_APPSMITH_STORE_PROPERTY_SETTER,
        );
      });
      it("3. Mutating appsmith store values by calling any functions on it", () => {
        const originalBinding =
          "myFun1() {\n\t\tappsmith.store.test.push(1);\n\t}";
        const script =
          "\n  function $$closedFn () {\n    const $$result = {myFun1() {\n\t\tappsmith.store.test.push(1);\n\t}}\n    return $$result\n  }\n  $$closedFn.call(THIS_CONTEXT)\n";
        const options = { isJsObject: true };

        const scriptType = getScriptType(false, false);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          webworkerTelemetry,
          data,
          options,
          originalBinding,
          script,
          scriptType,
        });

        expect(lintErrors.length).toEqual(1);
        expect(lintErrors[0].code).toEqual(
          CustomLintErrorCode.INVALID_APPSMITH_STORE_PROPERTY_SETTER,
        );
      });
    });

    describe("4. Config rule tests", () => {
      // Test for 'eqeqeq: false' (Allow '==' and '!=')
      it("1. Should allow '==' and '!=' without errors", () => {
        const data = { x: 5, y: "5" };
        const originalBinding = "{{ x == y }}";
        const script = "x == y";

        const scriptType = getScriptType(false, true);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          data,
          originalBinding,
          script,
          scriptType,
          webworkerTelemetry,
        });

        expect(Array.isArray(lintErrors)).toBe(true);
        // Should have no errors for using '=='
        expect(lintErrors.length).toEqual(0);
      });

      // Test for `curly: false` (Blocks can be added without {}, eg if (x) return true
      it("2. Should allow blocks without brackets", () => {
        const data = {};
        const originalBinding = "{{ if (true) console.log('ok') }}";
        const script = "if (true) console.log('ok')";

        const scriptType = getScriptType(false, true);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          data,
          originalBinding,
          script,
          scriptType,
          webworkerTelemetry,
        });

        expect(Array.isArray(lintErrors)).toBe(true);
        // Should have no errors
        expect(lintErrors.length).toEqual(0);
      });

      // Test for 'freeze: true' (Do not allow mutations of native objects)
      it("3. Should error when modifying native objects", () => {
        const data = {};
        const originalBinding = "{{ Array.prototype.myFunc = function() {} }}";
        const script = "Array.prototype.myFunc = function() {}";

        const scriptType = getScriptType(false, true);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          data,
          originalBinding,
          script,
          scriptType,
          webworkerTelemetry,
        });

        expect(Array.isArray(lintErrors)).toBe(true);
        // Should have at least one error for modifying native objects
        expect(lintErrors.length).toBeGreaterThan(0);
        expect(
          lintErrors.some(
            (error) =>
              error.errorMessage.name === "LintingError" &&
              (error.errorMessage.message ===
                "Extending prototype of native object: 'Array'." ||
                error.errorMessage.message ===
                  "Array prototype is read only, properties should not be added."),
          ),
        ).toBe(true);
      });

      // Test for 'undef: true' (Disallow use of undeclared variables)
      it("4. Should error on use of undeclared variables", () => {
        const data = {};
        const originalBinding = "{{ x + 1 }}";
        const script = "x + 1"; // 'x' is undeclared

        const scriptType = getScriptType(false, true);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          data,
          originalBinding,
          script,
          scriptType,
          webworkerTelemetry,
        });

        expect(Array.isArray(lintErrors)).toBe(true);
        // Should have at least one error for 'x' being undefined
        expect(lintErrors.length).toBeGreaterThan(0);
        // Check if the error code corresponds to undefined variable
        expect(
          lintErrors.some(
            (error) =>
              error.errorMessage.name === "LintingError" &&
              error.errorMessage.message === "'x' is not defined.",
          ),
        ).toBe(true);
      });

      // Test for 'noempty: false' (Allow empty blocks)
      it("6. Should allow empty blocks without errors", () => {
        const data = {};
        const originalBinding = "{{ if (true) { } }}";
        const script = "if (true) { }";

        const scriptType = getScriptType(false, true);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          data,
          originalBinding,
          script,
          scriptType,
          webworkerTelemetry,
        });

        expect(Array.isArray(lintErrors)).toBe(true);
        // Should have no errors
        expect(lintErrors.length).toEqual(0);
      });
    });
  },
);
