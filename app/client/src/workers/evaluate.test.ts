import evaluate, {
  setupEvaluationEnvironment,
  isFunctionAsync,
} from "workers/evaluate";
import {
  DataTree,
  DataTreeWidget,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { RenderModes } from "constants/WidgetConstants";

describe("evaluate synchronous code", () => {
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
  it("unescapes string before evaluation", async () => {
    const js = '\\"Hello!\\"';
    const response = await evaluate(
      js,
      {},
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.result).toBe("Hello!");
  });
  it("evaluate string post unescape in v1", async () => {
    const js = '[1, 2, 3].join("\\\\n")';
    const response = await evaluate(
      js,
      {},
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.result).toBe("1\n2\n3");
  });
  it("evaluate string without unescape in v2", async () => {
    self.evaluationVersion = 2;
    const js = '[1, 2, 3].join("\\n")';
    const response = await evaluate(
      js,
      {},
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.result).toBe("1\n2\n3");
  });
  // it("throws error for undefined js", () => {
  //   // @ts-expect-error: Types are not available
  //   expect(async () => await evaluate(undefined, {})).toThrow(
  //     TypeError,
  //   );
  // });
  it("Returns for syntax errors", async () => {
    const response1 = await evaluate(
      "wrongJS",
      {},
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response1.errors.length).toEqual(1);
    expect(response1.errors[0].errorMessage).toEqual(
      "ReferenceError: wrongJS is not defined",
    );
    const response2 = await evaluate(
      "{}.map()",
      {},
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response2.errors.length).toEqual(1);
    expect(response2.errors[0].errorMessage).toEqual(
      "TypeError: {}.map is not a function",
    );
  });
  it("evaluates value from data tree", async () => {
    const js = "Input1.text";
    const response = await evaluate(
      js,
      dataTree,
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.result).toBe("value");
  });
  it("disallows unsafe function calls", async () => {
    const js = "setImmediate(() => {}, 100)";
    const response = await evaluate(
      js,
      dataTree,
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.errors.length).toBe(1);
  });
  it("has access to extra library functions", async () => {
    const js = "_.add(1,2)";
    const response = await evaluate(
      js,
      dataTree,
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.result).toBe(3);
  });
  it("evaluates functions with callback data", async () => {
    const js = "(arg1, arg2) => arg1.value + arg2";
    const callbackData = [{ value: "test" }, "1"];
    const response = await evaluate(
      js,
      dataTree,
      {},
      { enableAppsmithFunctions: false, evalArguments: callbackData },
    );
    expect(response.result).toBe("test1");
  });
  it("handles EXPRESSIONS with new lines", async () => {
    let js = "\n";
    let response = await evaluate(
      js,
      dataTree,
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.errors.length).toBe(0);

    js = "\n\n\n";
    response = await evaluate(
      js,
      dataTree,
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.errors.length).toBe(0);
  });
  it("handles TRIGGERS with new lines", async () => {
    let js = "\n";
    let response = await evaluate(
      js,
      dataTree,
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.errors.length).toBe(0);

    js = "\n\n\n";
    response = await evaluate(
      js,
      dataTree,
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.errors.length).toBe(0);
  });
  it("handles ANONYMOUS_FUNCTION with new lines", async () => {
    let js = "\n";
    let response = await evaluate(
      js,
      dataTree,
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.errors.length).toBe(0);

    js = "\n\n\n";
    response = await evaluate(
      js,
      dataTree,
      {},
      { enableAppsmithFunctions: false },
    );
    expect(response.errors.length).toBe(0);
  });
  it("has access to this context", async () => {
    const js = "this.contextVariable";
    const thisContext = { contextVariable: "test" };
    const response = await evaluate(
      js,
      dataTree,
      {},
      {
        enableAppsmithFunctions: false,
        context: {
          thisContext,
        },
      },
    );
    expect(response.result).toBe("test");
    // there should not be any error when accessing "this" variables
    expect(response.errors).toHaveLength(0);
  });

  it("has access to additional global context", async () => {
    const js = "contextVariable";
    const globalContext = { contextVariable: "test" };
    const response = await evaluate(
      js,
      dataTree,
      {},
      {
        enableAppsmithFunctions: false,
        context: {
          globalContext,
        },
      },
    );
    expect(response.result).toBe("test");
    expect(response.errors).toHaveLength(0);
  });
});

describe("evaluate asynchronous code", () => {
  it("runs and completes", async () => {
    const js = "(() => new Promise((resolve) => { resolve(123) }))()";
    self.postMessage = jest.fn();
    const response = await evaluate(
      js,
      {},
      {},
      { enableAppsmithFunctions: true },
    );
    expect(response).toEqual({
      errors: [],
      logs: [],
      result: 123,
      triggers: [],
    });
  });
  it("runs and returns errors", async () => {
    jest.restoreAllMocks();
    const js = "(() => new Promise((resolve) => { randomKeyword }))()";
    self.postMessage = jest.fn();
    const response = await evaluate(
      js,
      {},
      {},
      { enableAppsmithFunctions: true },
    );
    expect(response).toEqual({
      errors: [
        {
          errorMessage: expect.stringContaining("randomKeyword is not defined"),
          errorType: "PARSE",
          originalBinding: expect.stringContaining("Promise"),
          raw: expect.stringContaining("Promise"),
          severity: "error",
        },
      ],
      triggers: [],
      result: undefined,
      logs: [],
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
