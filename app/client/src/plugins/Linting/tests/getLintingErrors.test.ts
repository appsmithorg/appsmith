import { getScriptType } from "workers/Evaluation/evaluate";
import { CustomLintErrorCode, LINTER_TYPE } from "../constants";
import getLintingErrors, { getLinterType } from "../utils/getLintingErrors";

const webworkerTelemetry = {};

jest.mock("../utils/getLintingErrors", () => {
  const originalModule = jest.requireActual("../utils/getLintingErrors");

  return {
    __esModule: true, // Ensure it treats the module as an ES module
    ...originalModule, // Spread all the original exports
    default: jest.fn(originalModule.default), // Mock the default export properly
    getLinterType: jest.fn(), // Mock the named export separately
  };
});

const linterTypes = [
  { linterType: LINTER_TYPE.JSHINT, name: "JSHint" },
  { linterType: LINTER_TYPE.ESLINT, name: "ESLint" },
];

describe.each(linterTypes)(
  "getLintingErrors with engine $name",
  ({ linterType }) => {
    beforeAll(() => {
      (getLinterType as jest.Mock).mockReturnValue(linterType);
    });
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
  },
);
