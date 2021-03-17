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
  };
  const dataTree: DataTree = {
    Input1: widget,
  };
  it("unescapes string before evaluation", () => {
    const js = '\\"Hello!\\"';
    const response = evaluate(js, {});
    expect(response.result).toBe("Hello!");
  });
  it("unescapes string and removes linebreaks before evaluation", () => {
    const js = "'Hello,\\nworld!'";
    const response = evaluate(js, {});
    expect(response.result).toBe("Hello,world!");
  });
  it("throws error for undefined js", () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => evaluate(undefined, {})).toThrow(TypeError);
  });
  it("throws for syntax errors", () => {
    expect(() => evaluate("wrongJS", {})).toThrow(ReferenceError);
    expect(() => evaluate("{}.map()", {})).toThrow(TypeError);
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
    expect(() => evaluate(js, dataTree)).toThrow(TypeError);
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
