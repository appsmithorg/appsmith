import { Severity } from "entities/AppsmithConsole";
import {
  EvaluationError,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import {
  getKeyPositionInString,
  getLintAnnotations,
  getAllWordOccurrences,
} from "./lintHelpers";

describe("getAllWordOccurences()", function() {
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
  const { LINT, PARSE } = PropertyEvaluationErrorType;
  const { ERROR, WARNING } = Severity;
  it("should return proper annotations", () => {
    const value = `Hello {{ world == test }}`;
    const errors: EvaluationError[] = [
      {
        errorType: LINT,
        raw:
          "\n  function closedFunction () {\n    const result =  world == test \n    return result;\n  }\n  closedFunction()\n  ",
        severity: WARNING,
        errorMessage: "Expected '===' and instead saw '=='.",
        errorSegment: "    const result =  world == test ",
        originalBinding: " world == test ",
        variables: ["===", "==", null, null],
        code: "W116",
        line: 0,
        ch: 8,
      },
      {
        errorType: LINT,
        raw:
          "\n  function closedFunction () {\n    const result =  world == test \n    return result;\n  }\n  closedFunction()\n  ",
        severity: WARNING,
        errorMessage: "'world' is not defined.",
        errorSegment: "    const result =  world == test ",
        originalBinding: " world == test ",
        variables: ["world", null, null, null],
        code: "W117",
        line: 0,
        ch: 2,
      },
      {
        errorMessage: "'test' is not defined.",
        severity: WARNING,
        raw:
          "\n  function closedFunction () {\n    const result =  world == test \n    return result;\n  }\n  closedFunction()\n  ",
        errorType: LINT,
        originalBinding: " world == test ",
        errorSegment: "    const result =  world == test ",
        variables: ["test", null, null, null],
        code: "W117",
        line: 0,
        ch: 11,
      },
    ];

    const res = getLintAnnotations(value, errors);
    expect(res).toEqual([
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
  });

  it("Return correct annotation with newline in original binding", () => {
    const value = `Hello {{ world
    }}`;
    const errors: EvaluationError[] = [
      {
        errorType: LINT,
        raw:
          "\n  function closedFunction () {\n    const result =  world\n\n    return result;\n  }\n  closedFunction()\n  ",
        severity: ERROR,
        errorMessage: "'world' is not defined.",
        errorSegment: "    const result =  world",
        originalBinding: " world\n",
        variables: ["world", null, null, null],
        code: "W117",
        line: 0,
        ch: 2,
      },
      {
        errorMessage: "ReferenceError: world is not defined",
        severity: ERROR,
        raw:
          "\n  function closedFunction () {\n    const result = world\n\n    return result;\n  }\n  closedFunction()\n  ",
        errorType: PARSE,
        originalBinding: " world\n",
      },
    ];

    const res = getLintAnnotations(value, errors);

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
});
