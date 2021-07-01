import evaluate from "workers/evaluate";
import {
  DataTree,
  DataTreeWidget,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { RenderModes, WidgetTypes } from "constants/WidgetConstants";

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
    type: WidgetTypes.INPUT_WIDGET,
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
  it("unescapes string before evaluation", () => {
    const js = '\\"Hello!\\"';
    const response = evaluate(js, {});
    expect(response.result).toBe("Hello!");
  });
  it("throws error for undefined js", () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => evaluate(undefined, {})).toThrow(TypeError);
  });
  it("Returns for syntax errors", () => {
    const response1 = evaluate("wrongJS", {});
    expect(response1).toStrictEqual({
      result: undefined,
      triggers: [],
      errors: [
        {
          errorMessage: "'wrongJS' is not defined.",
          errorSegment: "return wrongJS",
          errorType: "LINT",
          raw: "return wrongJS",
          severity: "warning",
        },
        {
          errorMessage: "ReferenceError: wrongJS is not defined",
          errorType: "PARSE",
          raw: "return wrongJS",
          severity: "error",
        },
      ],
    });
    const response2 = evaluate("{}.map()", {});
    expect(response2).toStrictEqual({
      result: undefined,
      triggers: [],
      errors: [
        {
          errorMessage: "TypeError: {}.map is not a function",
          errorType: "PARSE",
          raw: "return {}.map()",
          severity: "error",
        },
      ],
    });
  });
  it("evaluates value from data tree", () => {
    const js = "Input1.text";
    const response = evaluate(js, dataTree);
    expect(response.result).toBe("value");
  });
  it("gets triggers from a function", () => {
    const js = "showAlert('message', 'info')";
    const response = evaluate(js, dataTree);
    expect(response.result).toBe(undefined);
    expect(response.triggers).toStrictEqual([
      {
        type: "SHOW_ALERT",
        payload: {
          message: "message",
          style: "info",
        },
      },
    ]);
  });
  it("disallows unsafe function calls", () => {
    const js = "setTimeout(() => {}, 100)";
    const response = evaluate(js, dataTree);
    expect(response).toStrictEqual({
      result: undefined,
      triggers: [],
      errors: [
        {
          errorMessage: "TypeError: setTimeout is not a function",
          errorType: "PARSE",
          raw: "return setTimeout(() => {}, 100)",
          severity: "error",
        },
      ],
    });
  });
  it("has access to extra library functions", () => {
    const js = "_.add(1,2)";
    const response = evaluate(js, dataTree);
    expect(response.result).toBe(3);
  });
  it("evaluates functions with callback data", () => {
    const js = "(arg1, arg2) => arg1.value + arg2";
    const callbackData = [{ value: "test" }, "1"];
    const response = evaluate(js, dataTree, callbackData);
    expect(response.result).toBe("test1");
  });
});
