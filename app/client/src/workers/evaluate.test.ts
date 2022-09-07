import evaluate, {
  setupEvaluationEnvironment,
  evaluateAsync,
  isFunctionAsync,
} from "workers/evaluate";
import {
  DataTree,
  DataTreeWidget,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { RenderModes } from "constants/WidgetConstants";

describe("evaluateSync", () => {
  // @ts-expect-error: meta property not provided
  const widget: DataTreeWidget = {
    bottomRow: 0,
    isLoading: false,
    leftColumn: 0,
    parentColumnSpace: 0,
    parentRowSpace: 0,
    renderMode: RenderModes.CANVAS,
    rightColumn: 0,
    topRow: 0,
    type: "INPUT_WIDGET_V2",
    version: 0,
    widgetId: "",
    widgetName: "",
    text: "value",
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    bindingPaths: {},
    reactivePaths: {},
    triggerPaths: {},
    validationPaths: {},
    logBlackList: {},
    overridingPropertyPaths: {},
    privateWidgets: {},
    propertyOverrideDependency: {},
  };
  const dataTree: DataTree = {
    Input1: widget,
  };
  beforeAll(() => {
    setupEvaluationEnvironment();
  });
  it("unescapes string before evaluation", () => {
    const js = '\\"Hello!\\"';
    const response = evaluate(js, {}, {}, false);
    expect(response.result).toBe("Hello!");
  });
  it("evaluate string post unescape in v1", () => {
    const js = '[1, 2, 3].join("\\\\n")';
    const response = evaluate(js, {}, {}, false);
    expect(response.result).toBe("1\n2\n3");
  });
  it("evaluate string without unescape in v2", () => {
    self.evaluationVersion = 2;
    const js = '[1, 2, 3].join("\\n")';
    const response = evaluate(js, {}, {}, false);
    expect(response.result).toBe("1\n2\n3");
  });
  it("throws error for undefined js", () => {
    // @ts-expect-error: Types are not available
    expect(() => evaluate(undefined, {})).toThrow(TypeError);
  });
  it("Returns for syntax errors", () => {
    const response1 = evaluate("wrongJS", {}, {}, false);
    expect(response1).toStrictEqual({
      result: undefined,
      errors: [
        {
          errorMessage: "ReferenceError: wrongJS is not defined",
          errorType: "PARSE",
          raw: `
  function closedFunction () {
    const result = wrongJS
    return result;
  }
  closedFunction.call(THIS_CONTEXT)
  `,
          severity: "error",
          originalBinding: "wrongJS",
        },
      ],
    });
    const response2 = evaluate("{}.map()", {}, {}, false);
    expect(response2).toStrictEqual({
      result: undefined,
      errors: [
        {
          errorMessage: "TypeError: {}.map is not a function",
          errorType: "PARSE",
          raw: `
  function closedFunction () {
    const result = {}.map()
    return result;
  }
  closedFunction.call(THIS_CONTEXT)
  `,
          severity: "error",
          originalBinding: "{}.map()",
        },
      ],
    });
  });
  it("evaluates value from data tree", () => {
    const js = "Input1.text";
    const response = evaluate(js, dataTree, {}, false);
    expect(response.result).toBe("value");
  });
  it("disallows unsafe function calls", () => {
    const js = "setTimeout(() => {}, 100)";
    const response = evaluate(js, dataTree, {}, false);
    expect(response).toStrictEqual({
      result: undefined,
      errors: [
        {
          errorMessage: "TypeError: setTimeout is not a function",
          errorType: "PARSE",
          raw: `
  function closedFunction () {
    const result = setTimeout(() => {}, 100)
    return result;
  }
  closedFunction.call(THIS_CONTEXT)
  `,
          severity: "error",
          originalBinding: "setTimeout(() => {}, 100)",
        },
      ],
    });
  });
  it("has access to extra library functions", () => {
    const js = "_.add(1,2)";
    const response = evaluate(js, dataTree, {}, false);
    expect(response.result).toBe(3);
  });
  it("evaluates functions with callback data", () => {
    const js = "(arg1, arg2) => arg1.value + arg2";
    const callbackData = [{ value: "test" }, "1"];
    const response = evaluate(js, dataTree, {}, false, {}, callbackData);
    expect(response.result).toBe("test1");
  });
  it("handles EXPRESSIONS with new lines", () => {
    let js = "\n";
    let response = evaluate(js, dataTree, {}, false);
    expect(response.errors.length).toBe(0);

    js = "\n\n\n";
    response = evaluate(js, dataTree, {}, false);
    expect(response.errors.length).toBe(0);
  });
  it("handles TRIGGERS with new lines", () => {
    let js = "\n";
    let response = evaluate(js, dataTree, {}, false, undefined, undefined);
    expect(response.errors.length).toBe(0);

    js = "\n\n\n";
    response = evaluate(js, dataTree, {}, false, undefined, undefined);
    expect(response.errors.length).toBe(0);
  });
  it("handles ANONYMOUS_FUNCTION with new lines", () => {
    let js = "\n";
    let response = evaluate(js, dataTree, {}, false, undefined, undefined);
    expect(response.errors.length).toBe(0);

    js = "\n\n\n";
    response = evaluate(js, dataTree, {}, false, undefined, undefined);
    expect(response.errors.length).toBe(0);
  });
  it("has access to this context", () => {
    const js = "this.contextVariable";
    const thisContext = { contextVariable: "test" };
    const response = evaluate(js, dataTree, {}, false, { thisContext });
    expect(response.result).toBe("test");
    // there should not be any error when accessing "this" variables
    expect(response.errors).toHaveLength(0);
  });

  it("has access to additional global context", () => {
    const js = "contextVariable";
    const globalContext = { contextVariable: "test" };
    const response = evaluate(js, dataTree, {}, false, { globalContext });
    expect(response.result).toBe("test");
    expect(response.errors).toHaveLength(0);
  });
});

describe("evaluateAsync", () => {
  it("runs and completes", async () => {
    const js = "(() => new Promise((resolve) => { resolve(123) }))()";
    self.postMessage = jest.fn();
    await evaluateAsync(js, {}, "TEST_REQUEST", {});
    expect(self.postMessage).toBeCalledWith({
      requestId: "TEST_REQUEST",
      responseData: {
        finished: true,
        result: { errors: [], result: 123, triggers: [] },
      },
      type: "PROCESS_TRIGGER",
    });
  });
  it("runs and returns errors", async () => {
    jest.restoreAllMocks();
    const js = "(() => new Promise((resolve) => { randomKeyword }))()";
    self.postMessage = jest.fn();
    await evaluateAsync(js, {}, "TEST_REQUEST_1", {});
    expect(self.postMessage).toBeCalledWith({
      requestId: "TEST_REQUEST_1",
      responseData: {
        finished: true,
        result: {
          errors: [
            {
              errorMessage: expect.stringContaining(
                "randomKeyword is not defined",
              ),
              errorType: "PARSE",
              originalBinding: expect.stringContaining("Promise"),
              raw: expect.stringContaining("Promise"),
              severity: "error",
            },
          ],
          triggers: [],
          result: undefined,
        },
      },
      type: "PROCESS_TRIGGER",
    });
  });
});

describe("isFunctionAsync", () => {
  it("identifies async functions", () => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const cases: Array<{ script: Function | string; expected: boolean }> = [
      {
        script: () => {
          return 1;
        },
        expected: false,
      },
      {
        script: () => {
          return new Promise((resolve) => {
            resolve(1);
          });
        },
        expected: true,
      },
      {
        script: "() => { showAlert('yo') }",
        expected: true,
      },
    ];

    for (const testCase of cases) {
      let testFunc = testCase.script;
      if (typeof testFunc === "string") {
        testFunc = eval(testFunc);
      }
      const actual = isFunctionAsync(testFunc, {}, {});
      expect(actual).toBe(testCase.expected);
    }
  });
});
