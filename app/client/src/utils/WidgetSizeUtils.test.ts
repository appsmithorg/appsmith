import { RenderModes } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  getCanvasBottomRow,
  getCanvasWidgetHeightsToUpdate,
} from "./WidgetSizeUtils";

const DUMMY_WIDGET: WidgetProps = {
  bottomRow: 0,
  isLoading: false,
  leftColumn: 0,
  parentColumnSpace: 0,
  parentRowSpace: 0,
  renderMode: RenderModes.CANVAS,
  rightColumn: 0,
  topRow: 0,
  type: "SKELETON_WIDGET",
  version: 2,
  widgetId: "",
  widgetName: "",
};

it("Computes the bottomRow of the canvas within a container correctly", () => {
  const canvasWidgets = {
    x: {
      ...DUMMY_WIDGET,
      widgetId: "x",
      bottomRow: 20,
      topRow: 10,
      type: "CONTAINER_WIDGET",
      children: ["m"],
    },
    m: {
      ...DUMMY_WIDGET,
      widgetId: "m",
      parentId: "x",
      children: ["n", "o"],
      type: "CANVAS_WIDGET",
    },
    n: {
      ...DUMMY_WIDGET,
      bottomRow: 30,
    },
    o: {
      ...DUMMY_WIDGET,
      bottomRow: 5,
    },
  };

  const result = getCanvasBottomRow("m", canvasWidgets);

  expect(result).toBe(300);
});

it("Computes the bottomRow of the canvas within a Modal correctly", () => {
  const canvasWidgets = {
    x: {
      ...DUMMY_WIDGET,
      widgetId: "x",
      bottomRow: 20,
      topRow: 10,
      height: 200,
      type: "MODAL_WIDGET",
      children: ["m"],
    },
    m: {
      ...DUMMY_WIDGET,
      widgetId: "m",
      parentId: "x",
      children: ["n", "o"],
      type: "CANVAS_WIDGET",
    },
    n: {
      ...DUMMY_WIDGET,
      parentId: "m",
      bottomRow: 30,
    },
    o: {
      ...DUMMY_WIDGET,
      parentId: "m",
      bottomRow: 5,
    },
  };

  const result = getCanvasBottomRow("m", canvasWidgets);

  expect(result).toBe(300);
});

it("Ignores the detached children of the canvas correctly", () => {
  const canvasWidgets = {
    x: {
      ...DUMMY_WIDGET,
      widgetId: "x",
      bottomRow: 20,
      topRow: 10,
      type: "CANVAS_WIDGET",
      children: ["m"],
    },
    m: {
      ...DUMMY_WIDGET,
      widgetId: "m",
      parentId: "x",
      children: ["n", "o"],
      type: "CANVAS_WIDGET",
    },
    n: {
      ...DUMMY_WIDGET,
      detachFromLayout: true,
      parentId: "m",
      bottomRow: 30,
    },
    o: {
      ...DUMMY_WIDGET,
      parentId: "m",
      bottomRow: 5,
    },
  };

  const result = getCanvasBottomRow("m", canvasWidgets);

  expect(result).toBe(100);
});

it("Computes the bottomRow of the canvas within a Modal correctly", () => {
  const canvasWidgets = {
    x: {
      ...DUMMY_WIDGET,
      widgetId: "x",
      bottomRow: 20,
      topRow: 10,
      height: 500,
      type: "MODAL_WIDGET",
      children: ["m"],
    },
    m: {
      ...DUMMY_WIDGET,
      widgetId: "m",
      parentId: "x",
      children: ["n", "o"],
      type: "CANVAS_WIDGET",
    },
    n: {
      ...DUMMY_WIDGET,
      bottomRow: 30,
    },
    o: {
      ...DUMMY_WIDGET,
      bottomRow: 5,
    },
  };

  const result = getCanvasBottomRow("m", canvasWidgets);

  expect(result).toBe(500);
});

it("Computes the bottomRow of the canvas within a Container when the container has larger height correctly", () => {
  // The Container widget has a height of 10 rows, while the lowest widget is at 6 rows, so, the canvas should take this into account
  // and return 10 * Row height == 100
  const canvasWidgets = {
    x: {
      ...DUMMY_WIDGET,
      widgetId: "x",
      bottomRow: 20,
      topRow: 10,
      type: "CONTAINER_WIDGET",
      children: ["m"],
    },
    m: {
      ...DUMMY_WIDGET,
      widgetId: "m",
      parentId: "x",
      children: ["n", "o"],
      type: "CANVAS_WIDGET",
    },
    n: {
      ...DUMMY_WIDGET,
      bottomRow: 6,
    },
    o: {
      ...DUMMY_WIDGET,
      bottomRow: 5,
    },
  };

  const result = getCanvasBottomRow("m", canvasWidgets);

  expect(result).toBe(100);
});

it("Computes all the effected canvases for the changed widgets", () => {
  const canvasWidgets = {
    x: {
      ...DUMMY_WIDGET,
      widgetId: "x",
      bottomRow: 20,
      topRow: 10,
      type: "CONTAINER_WIDGET",
      children: ["m"],
    },
    m: {
      ...DUMMY_WIDGET,
      widgetId: "m",
      parentId: "x",
      children: ["n", "o", "p"],
      type: "CANVAS_WIDGET",
    },
    n: {
      ...DUMMY_WIDGET,
      bottomRow: 6,
    },
    o: {
      ...DUMMY_WIDGET,
      bottomRow: 5,
    },
    p: {
      ...DUMMY_WIDGET,
      widgetId: "p",
      bottomRow: 20,
      topRow: 10,
      type: "CONTAINER_WIDGET",
      children: ["q"],
      parentId: "m",
    },
    q: {
      ...DUMMY_WIDGET,
      widgetId: "q",
      parentId: "p",
      children: [],
      type: "CANVAS_WIDGET",
    },
  };

  // Since the container p has changed, it will effect the parent m and the child q

  const result = getCanvasWidgetHeightsToUpdate(["p"], canvasWidgets);

  expect(result).toStrictEqual({ q: 100, m: 200 });
});
