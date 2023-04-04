import { Severity } from "entities/AppsmithConsole";
import type { LintError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import {
  INVALID_JSOBJECT_START_STATEMENT,
  INVALID_JSOBJECT_START_STATEMENT_ERROR_CODE,
} from "workers/Linting/constants";
import { CODE_EDITOR_START_POSITION } from "./constants";
import {
  getKeyPositionInString,
  getLintAnnotations,
  getAllWordOccurrences,
  getFirstNonEmptyPosition,
} from "./lintHelpers";

describe("getAllWordOccurences()", function () {
  it("should get all the indexes", () => {
    const res = getAllWordOccurrences("this is a `this` string", "this");
    expect(res).toEqual([0, 11]);
  });

  it("should return empty array", () => {
    expect(getAllWordOccurrences("this is a string", "number")).toEqual([]);
  });
});

describe("getKeyPositionsInString()", () => {
  it("should return results for single line string", () => {
    const res = getKeyPositionInString("this is a `this` string", "this");
    expect(res).toEqual([
      { line: 0, ch: 0 },
      { line: 0, ch: 11 },
    ]);
  });

  it("should return results for multiline string", () => {
    const res = getKeyPositionInString("this is a \n`this` string", "this");
    expect(res).toEqual([
      { line: 0, ch: 0 },
      { line: 1, ch: 1 },
    ]);
  });
});

describe("getLintAnnotations()", () => {
  const { LINT } = PropertyEvaluationErrorType;
  const { ERROR, WARNING } = Severity;
  it("should return proper annotations", () => {
    const value1 = `Hello {{ world == test }}`;
    const errors1: LintError[] = [
      {
        errorType: LINT,
        raw: "\n  function closedFunction () {\n    const result =  world == test \n    return result;\n  }\n  closedFunction()\n  ",
        severity: WARNING,
        errorMessage: {
          name: "LintingError",
          message: "Expected '===' and instead saw '=='.",
        },
        errorSegment: "    const result =  world == test ",
        originalBinding: " world == test ",
        variables: ["===", "==", null, null],
        code: "W116",
        line: 0,
        ch: 8,
      },
      {
        errorType: LINT,
        raw: "\n  function closedFunction () {\n    const result =  world == test \n    return result;\n  }\n  closedFunction()\n  ",
        severity: WARNING,
        errorMessage: {
          name: "LintingError",
          message: "'world' is not defined.",
        },
        errorSegment: "    const result =  world == test ",
        originalBinding: " world == test ",
        variables: ["world", null, null, null],
        code: "W117",
        line: 0,
        ch: 2,
      },
      {
        errorMessage: {
          name: "LintingError",
          message: "'test' is not defined.",
        },
        severity: WARNING,
        raw: "\n  function closedFunction () {\n    const result =  world == test \n    return result;\n  }\n  closedFunction()\n  ",
        errorType: LINT,
        originalBinding: " world == test ",
        errorSegment: "    const result =  world == test ",
        variables: ["test", null, null, null],
        code: "W117",
        line: 0,
        ch: 11,
      },
    ];

    const res1 = getLintAnnotations(value1, errors1, {});
    expect(res1).toEqual([
      {
        from: {
          line: 0,
          ch: 15,
        },
        to: {
          line: 0,
          ch: 17,
        },
        message: "Expected '===' and instead saw '=='.",
        severity: "warning",
      },
      {
        from: {
          line: 0,
          ch: 9,
        },
        to: {
          line: 0,
          ch: 14,
        },
        message: "'world' is not defined.",
        severity: "warning",
      },
      {
        from: {
          line: 0,
          ch: 18,
        },
        to: {
          line: 0,
          ch: 22,
        },
        message: "'test' is not defined.",
        severity: "warning",
      },
    ]);

    /// 2
    const value2 = `hss{{hss}}`;
    const errors2: LintError[] = [
      {
        errorType: LINT,
        raw: "\n  function closedFunction () {\n    const result = hss\n    return result;\n  }\n  closedFunction.call(THIS_CONTEXT)\n  ",
        severity: ERROR,
        errorMessage: {
          name: "LintingError",
          message: "'hss' is not defined.",
        },
        errorSegment: "    const result = hss",
        originalBinding: "{{hss}}",
        variables: ["hss", null, null, null],
        code: "W117",
        line: 0,
        ch: 1,
      },
    ];

    const res2 = getLintAnnotations(value2, errors2, {});
    expect(res2).toEqual([
      {
        from: {
          line: 0,
          ch: 5,
        },
        to: {
          line: 0,
          ch: 8,
        },
        message: "'hss' is not defined.",
        severity: "error",
      },
    ]);
  });

  it("should return correct annotation with newline in original binding", () => {
    const value = `Hello {{ world
    }}`;
    const errors: LintError[] = [
      {
        errorType: LINT,
        raw: "\n  function closedFunction () {\n    const result =  world\n\n    return result;\n  }\n  closedFunction()\n  ",
        severity: ERROR,
        errorMessage: {
          name: "LintingError",
          message: "'world' is not defined.",
        },
        errorSegment: "    const result =  world",
        originalBinding: " world\n",
        variables: ["world", null, null, null],
        code: "W117",
        line: 0,
        ch: 2,
      },
    ];

    const res = getLintAnnotations(value, errors, {});

    expect(res).toEqual([
      {
        from: {
          line: 0,
          ch: 9,
        },
        to: {
          line: 0,
          ch: 14,
        },
        message: "'world' is not defined.",
        severity: "error",
      },
    ]);
  });

  it("should return proper annotation when jsobject does not start with expected statement", () => {
    const value = `// An invalid JS Object
    export default {

    }
    `;
    const errors: LintError[] = [
      {
        errorType: PropertyEvaluationErrorType.LINT,
        errorSegment: "",
        originalBinding: value,
        line: 0,
        ch: 0,
        code: INVALID_JSOBJECT_START_STATEMENT_ERROR_CODE,
        variables: [],
        raw: value,
        errorMessage: {
          name: "LintingError",
          message: INVALID_JSOBJECT_START_STATEMENT,
        },
        severity: Severity.ERROR,
      },
    ];

    const res = getLintAnnotations(value, errors, { isJSObject: true });
    expect(res).toEqual([
      {
        from: {
          line: 0,
          ch: 0,
        },
        to: {
          line: 0,
          ch: 23,
        },
        message: "JSObject must start with 'export default'",
        severity: "error",
      },
    ]);
  });
});

describe("getFirstNonEmptyPosition", () => {
  it("should return valid first non-empty position", () => {
    const lines1 = ["", "export default{", "myFun1:()=> 1"];
    const lines2 = ["export default{", "myFun1:()=> 1"];
    const lines3: string[] = [];

    const expectedPosition1 = {
      line: 1,
      ch: 15,
    };
    const expectedPosition2 = {
      line: 0,
      ch: 15,
    };
    const expectedPosition3 = CODE_EDITOR_START_POSITION;

    const actualPosition1 = getFirstNonEmptyPosition(lines1);
    const actualPosition2 = getFirstNonEmptyPosition(lines2);
    const actualPosition3 = getFirstNonEmptyPosition(lines3);

    expect(expectedPosition1).toEqual(actualPosition1);
    expect(expectedPosition2).toEqual(actualPosition2);
    expect(expectedPosition3).toEqual(actualPosition3);
  });
});
