import evaluate, { setupEvaluationEnvironment } from "workers/evaluate";
import {
  DataTree,
  DataTreeWidget,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { RenderModes } from "constants/WidgetConstants";

describe("evaluate", () => {
  const widget: DataTreeWidget = {
    bottomRow: 0,
    isLoading: false,
    leftColumn: 0,
    parentColumnSpace: 0,
    parentRowSpace: 0,
    renderMode: RenderModes.CANVAS,
    rightColumn: 0,
    topRow: 0,
    type: "INPUT_WIDGET",
    version: 0,
    widgetId: "",
    widgetName: "",
    text: "value",
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    bindingPaths: {},
    triggerPaths: {},
    validationPaths: {},
    logBlackList: {},
  };
  const dataTree: DataTree = {
    Input1: widget,
  };
  beforeAll(() => {
    setupEvaluationEnvironment();
  });
  it("unescapes string before evaluation", () => {
    const js = '\\"Hello!\\"';
    const response = evaluate(js, {}, {});
    expect(response.result).toBe("Hello!");
  });
  it("throws error for undefined js", () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => evaluate(undefined, {})).toThrow(TypeError);
  });
  it("Returns for syntax errors", () => {
    const response1 = evaluate("wrongJS", {}, {});
    expect(response1).toStrictEqual({
      result: undefined,
      triggers: [],
      errors: [
        {
          ch: 1,
          code: "W117",
          errorMessage: "'wrongJS' is not defined.",
          errorSegment: "    const result = wrongJS",
          errorType: "LINT",
          line: 0,
          raw: `
  function closedFunction () {
    const result = wrongJS
    return result;
  }
  closedFunction()
  `,
          severity: "error",
          originalBinding: "wrongJS",
          variables: ["wrongJS", undefined, undefined, undefined],
        },
        {
          errorMessage: "ReferenceError: wrongJS is not defined",
          errorType: "PARSE",
          raw: `
  function closedFunction () {
    const result = wrongJS
    return result;
  }
  closedFunction()
  `,
          severity: "error",
          originalBinding: "wrongJS",
        },
      ],
    });
    const response2 = evaluate("{}.map()", {}, {});
    expect(response2).toStrictEqual({
      result: undefined,
      triggers: [],
      errors: [
        {
          errorMessage: "TypeError: {}.map is not a function",
          errorType: "PARSE",
          raw: `
  function closedFunction () {
    const result = {}.map()
    return result;
  }
  closedFunction()
  `,
          severity: "error",
          originalBinding: "{}.map()",
        },
      ],
    });
  });
  it("evaluates value from data tree", () => {
    const js = "Input1.text";
    const response = evaluate(js, dataTree, {});
    expect(response.result).toBe("value");
  });
  it("gets triggers from a function", () => {
    const js = "showAlert('message', 'info')";
    const response = evaluate(js, dataTree, {}, undefined, true);
    //this will be changed again in new implemenation for promises
    const data = {
      action: {
        payload: {
          executor: [
            {
              payload: { message: "message", style: "info" },
              type: "SHOW_ALERT",
            },
          ],
          then: [],
        },
        type: "PROMISE",
      },
      triggerReference: 0,
    };
    expect(response.result).toEqual(data);
    expect(response.triggers).toStrictEqual([
      {
        type: "PROMISE",
        payload: {
          executor: [
            {
              type: "SHOW_ALERT",
              payload: {
                message: "message",
                style: "info",
              },
            },
          ],
          then: [],
        },
      },
    ]);
  });
  it("disallows unsafe function calls", () => {
    const js = "setTimeout(() => {}, 100)";
    const response = evaluate(js, dataTree, {});
    expect(response).toStrictEqual({
      result: undefined,
      triggers: [],
      errors: [
        {
          errorMessage: "TypeError: setTimeout is not a function",
          errorType: "PARSE",
          raw: `
  function closedFunction () {
    const result = setTimeout(() => {}, 100)
    return result;
  }
  closedFunction()
  `,
          severity: "error",
          originalBinding: "setTimeout(() => {}, 100)",
        },
      ],
    });
  });
  it("has access to extra library functions", () => {
    const js = "_.add(1,2)";
    const response = evaluate(js, dataTree, {});
    expect(response.result).toBe(3);
  });
  it("evaluates functions with callback data", () => {
    const js = "(arg1, arg2) => arg1.value + arg2";
    const callbackData = [{ value: "test" }, "1"];
    const response = evaluate(js, dataTree, {}, callbackData);
    expect(response.result).toBe("test1");
  });
});
