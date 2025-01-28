import {
  EvaluationScriptType,
  getScriptType,
} from "workers/Evaluation/evaluate";
import { CustomLintErrorCode, LINTER_TYPE } from "../constants";
import getLintingErrors from "../utils/getLintingErrors";
import { Severity } from "entities/AppsmithConsole";

// Define all the custom eslint rules you want to test here
jest.mock("ee/utils/lintRulesHelpers", () => ({
  getLintRulesBasedOnContext: jest.fn(() => ({
    "customRules/no-floating-promises": "error",
  })),
}));

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
        expect(lintErrors.length).toBe(1);
        const lintError = lintErrors[0];
        const expectedErrorMessage =
          linterType === LINTER_TYPE.JSHINT
            ? "Extending prototype of native object: 'Array'."
            : "Array prototype is read only, properties should not be added.";

        expect(lintError.severity).toBe(Severity.ERROR);

        expect(lintError.errorMessage.message).toContain(expectedErrorMessage);
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
        expect(lintErrors.length).toBe(1);
        // Check if the error code corresponds to undefined variable
        const lintError = lintErrors[0];
        const expectedErrorMessage = "'x' is not defined.";

        expect(lintError.severity).toBe(Severity.ERROR);

        expect(lintError.errorMessage.message).toContain(expectedErrorMessage);
      });

      // Test for 'forin: false' (Doesn't require filtering for..in loops with obj.hasOwnProperty())
      it("5. Should allow unflitered forin loops without error", () => {
        const data = { obj: { a: 1, b: 2 } };
        const originalBinding =
          "{{ for (var key in obj) { console.log(key); } }}";
        const script = "for (var key in obj) { console.log(key); }";

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
        // Should have no errors for unfiltered 'for-in' loops
        expect(lintErrors.length).toEqual(0);
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

      // Test for 'strict: false' (strict mode is not enforced)
      it("7. should allow blocks without strict mode enabled", () => {
        const data = {
          THIS_CONTEXT: {},
        };
        const originalBinding = "myFun1() {\n\t\tconsole.log('test');\n\t};";
        const script =
          "\n  function $$closedFn () {\n    const $$result = {myFun1() {\n\t\tconsole.log('test');\n\t}};\n    return $$result;\n  }\n  $$closedFn.call(THIS_CONTEXT);\n";
        const options = { isJsObject: true };

        const scriptType = getScriptType(false, true);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          data,
          originalBinding,
          options,
          script,
          scriptType,
          webworkerTelemetry,
        });

        expect(Array.isArray(lintErrors)).toBe(true);
        // Should have no errors for missing 'use strict'
        expect(lintErrors.length).toEqual(0);
      });

      // Test for 'unused: 'strict'' (if a variable is defined, it should be used)
      it("8. should throw error for unused variables", () => {
        const data = {};
        const originalBinding = "{{ const x = 1; }}";
        const script = "const x = 1;";

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
        expect(lintErrors.length).toEqual(1);
        const lintError = lintErrors[0];

        const expectedMessage =
          linterType === LINTER_TYPE.JSHINT
            ? "'x' is defined but never used."
            : "'x' is assigned a value but never used.";

        expect(lintError.severity).toBe(Severity.WARNING);
        expect(lintError.errorMessage.message).toBe(expectedMessage);
      });

      // Test for 'unused: 'strict'' (if a variable is defined, it should be used)
      it("9. should allow expressions without trailing semicolon", () => {
        const data = {
          THIS_CONTEXT: {},
        };
        const originalBinding = "myFun1() {\n\t\tconsole.log('test')\n\t}";
        const script =
          "\n  function $$closedFn () {\n    const $$result = {myFun1() {\n\t\tconsole.log('test')\n\t}}\n    return $$result\n  }\n  $$closedFn.call(THIS_CONTEXT)\n";
        const options = { isJsObject: true };

        const scriptType = getScriptType(false, true);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          data,
          originalBinding,
          options,
          script,
          scriptType,
          webworkerTelemetry,
        });

        expect(Array.isArray(lintErrors)).toBe(true);
        // Should have no errors
        expect(lintErrors.length).toEqual(0);
      });

      // Test for 'boss: true' (Allow assignments in conditions)
      it("10. Should allow assignments in conditions without errors", () => {
        const data = { a: 0, b: 1 };
        const originalBinding = "{{ if (a = b) { console.log(a); } }}";
        const script = "if (a = b) { console.log(a); }";

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
        // Should have no errors for assignments in conditions
        expect(lintErrors.length).toEqual(0);
      });

      // Test for 'evil: false' (Disallow use of eval)
      it("11a. Should error when 'eval' is used", () => {
        const data = {};
        const originalBinding = "{{ eval('var a = 1;') }}";
        const script = "eval('var a = 1;');";

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
        expect(lintErrors.length).toEqual(1);
        const lintError = lintErrors[0];

        const expectedMessage = "eval can be harmful.";

        expect(lintError.severity).toBe(Severity.ERROR);
        expect(lintError.errorMessage.message).toBe(expectedMessage);
      });

      // Test for 'evil: false' (Disallow use of eval)
      it("11b. should error on indirect eval", () => {
        const data = {};
        const originalBinding = "{{ (0, eval)('var a = 1;') }}";
        const script = "(0, eval)('var a = 1;');";

        const scriptType = getScriptType(false, true);
        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          data,
          originalBinding,
          script,
          scriptType,
          webworkerTelemetry,
        });

        const expectedErrorMessage =
          linterType === LINTER_TYPE.JSHINT
            ? "Unorthodox function invocation."
            : "eval can be harmful.";

        expect(lintErrors.length).toEqual(1);
        expect(lintErrors[0].severity).toBe(Severity.ERROR);
        expect(lintErrors[0].errorMessage.message).toBe(expectedErrorMessage);
      });

      // Test for 'funcscope: true' (Allow variable definitions inside control statements)
      it("12. Should allow variable definitions inside control statements without errors", () => {
        const data = {
          THIS_CONTEXT: {},
        };
        const originalBinding =
          "myFun1() {\n\t\tif (true) { var x = 1; console.log(x); } x+=1;\n\t};";
        const script =
          "\n  function $$closedFn () {\n    const $$result = {myFun1() {\n\t\tif (true) { var x = 1; console.log(x); } x+=1;\n\t}};\n    return $$result;\n  }\n  $$closedFn.call(THIS_CONTEXT);\n";
        const options = { isJsObject: true };

        const scriptType = getScriptType(false, true);

        const lintErrors = getLintingErrors({
          getLinterTypeFn: () => linterType,
          data,
          originalBinding,
          script,
          scriptType,
          options,
          webworkerTelemetry,
        });

        expect(Array.isArray(lintErrors)).toBe(true);
        // Should have no errors
        expect(lintErrors.length).toEqual(0);
      });

      // Test for 'sub: true' (Allow all property accessors)
      it("13. Should allow bracket notation property access without errors", () => {
        const data = { obj: { property: 1 } };
        const originalBinding = "{{ obj['property']; }}";
        const script = "obj['property'];";

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
        // Should have no errors for using bracket notation
        expect(lintErrors.length).toEqual(0);
      });

      // Test for 'expr: true' (Allow expressions where statements are expected)
      it("14. Should allow expressions as statements without errors", () => {
        const data = { a: true, b: false };
        const originalBinding = "{{ a || b; }}";
        const script = "a || b;";

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
        // Should have no errors for expressions used as statements
        expect(lintErrors.length).toEqual(0);
      });
    });
  },
);

describe("Custom lint checks", () => {
  // This is done since all custom lint rules need eslint as linter type
  const getLinterTypeFn = () => LINTER_TYPE.ESLINT;

  // Test for 'no floating promises lint rule'
  it("1. should show error for unhandled promises", () => {
    const data = {
      ARGUMENTS: undefined,
      Query1: {
        actionId: "671b2fcc-e574",
        isLoading: false,
        responseMeta: {
          isExecutionSuccess: false,
        },
        config: {
          timeoutInMillisecond: 10000,
          paginationType: "NONE",
          encodeParamsToggle: true,
          body: "SELECT * FROM <<your_table_name>> LIMIT 10;\n\n-- Please enter a valid table name and hit RUN\n",
          pluginSpecifiedTemplates: [
            {
              value: true,
            },
          ],
        },
        ENTITY_TYPE: "ACTION",
        datasourceUrl: "",
        name: "Query1",
        run: async function () {},
        clear: async function () {},
      },
      JSObject1: {
        body: "export default {\n\tasync handledAsync() {\n\t\tawait Query1.run(); \n\t},\n\tasync unhandledAsync() {\n\t\tQuery1.run();\n\t}\n}",
        ENTITY_TYPE: "JSACTION",
        actionId: "d24fc04a-910b",
        handledAsync: "async function () {\n  await Query1.run();\n}",
        "handledAsync.data": {},
        unhandledAsync: "async function () {\n  Query1.run();\n}",
        "unhandledAsync.data": {},
      },
      THIS_CONTEXT: {},
    };

    const originalBinding = "async unhandledAsync() {\n\t\tQuery1.run();\n\t}";
    const script =
      "\n  function $$closedFn () {\n    const $$result = {async unhandledAsync() {\n\t\tQuery1.run();\n\t}}\n    return $$result\n  }\n  $$closedFn.call(THIS_CONTEXT)\n  ";
    const options = { isJsObject: true };

    const lintErrors = getLintingErrors({
      getLinterTypeFn,
      data,
      originalBinding,
      script,
      scriptType: EvaluationScriptType.EXPRESSION,
      options,
      webworkerTelemetry,
    });

    expect(Array.isArray(lintErrors)).toBe(true);
    expect(lintErrors.length).toEqual(1);
    //expect(lintErrors[0].code).toEqual(
    //  CustomLintErrorCode.INVALID_ENTITY_PROPERTY,
    //);
    expect(lintErrors[0].errorMessage.message).toContain(
      "Unhandled Promise detected.",
    );
  });
});
