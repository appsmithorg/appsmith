import { nestDSL, flattenDSL } from "./lib";
import { ROOT_CONTAINER_WIDGET_ID } from "./constants";

describe("Test #1 - Check export types & constant values", () => {
  it("nestDSL is a function", () => {
    expect(typeof nestDSL).toBe("function");
  });

  it("flattenDSL is a function", () => {
    expect(typeof flattenDSL).toBe("function");
  });

  it("ROOT_CONTAINER_WIDGET_ID is a string", () => {
    expect(typeof ROOT_CONTAINER_WIDGET_ID).toBe("string");
  });

  it("ROOT_CONTAINER_WIDGET_ID remains 0", () => {
    expect(ROOT_CONTAINER_WIDGET_ID).toBe("0");
  });
});

describe("Test #2 - normalize operations on SIMPLE DSL structures", () => {
  const simple_dsl = {
    widgetId: "0",
    widgetName: "MainContainer",
    isCanvas: true,
    children: [
      {
        widgetId: "0/0",
        widgetName: "Text1",
        isCanvas: false,
      },
      {
        widgetId: "0/1",
        widgetName: "Container1",
        isCanvas: false,
        children: [
          {
            widgetId: "0/1/0",
            widgetName: "Canvas1",
            isCanvas: true,
            children: [
              {
                widgetId: "0/1/0/0",
                widgetName: "Button1",
                isCanvas: false,
                label: "Click me!",
              },
            ],
          },
        ],
      },
    ],
  };
  const simple_flat_dsl = {
    "0": {
      widgetId: "0",
      widgetName: "MainContainer",
      isCanvas: true,
      children: ["0/0", "0/1"],
    },
    "0/0": {
      widgetId: "0/0",
      widgetName: "Text1",
      isCanvas: false,
    },
    "0/1": {
      widgetId: "0/1",
      widgetName: "Container1",
      children: ["0/1/0"],
      isCanvas: false,
    },
    "0/1/0": {
      widgetId: "0/1/0",
      widgetName: "Canvas1",
      isCanvas: true,
      children: ["0/1/0/0"],
    },
    "0/1/0/0": {
      widgetId: "0/1/0/0",
      widgetName: "Button1",
      isCanvas: false,
      label: "Click me!",
    },
  };

  it("Test `flattenDSL` for simple_dsl", () => {
    const flatDSL = flattenDSL<Record<string, unknown>>(simple_dsl);

    expect(flatDSL).toStrictEqual(simple_flat_dsl);
  });

  it("Test `nestDSL` for simple_flat_dsl", () => {
    const nestedDSL = nestDSL(simple_flat_dsl);

    expect(nestedDSL).toStrictEqual(simple_dsl);
  });
});

export {};
