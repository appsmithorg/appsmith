import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer.types";
import {
  deselectAll,
  pushPopWidgetSelection,
  selectMultipleWidgets,
  selectOneWidget,
  shiftSelectWidgets,
  unselectWidget,
} from "./WidgetSelectUtils";

describe("Wigdet selection methods", () => {
  const allWidgetsMock: CanvasWidgetsReduxState = {
    widgetId1: {
      widgetId: "widgetId1",
      parentId: "0",
      type: "BUTTON_WIDGET",
      widgetName: "Button1",
      version: 0,
      renderMode: "CANVAS",
      parentColumnSpace: 0,
      parentRowSpace: 0,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      isLoading: false,
    },
    widgetId2: {
      widgetId: "widgetId2",
      parentId: "0",
      type: "BUTTON_WIDGET",
      widgetName: "Button2",
      version: 0,
      renderMode: "CANVAS",
      parentColumnSpace: 0,
      parentRowSpace: 0,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      isLoading: false,
    },
    widgetId3: {
      widgetId: "widgetId3",
      parentId: "1",
      type: "BUTTON_WIDGET",
      widgetName: "Button3",
      version: 0,
      renderMode: "CANVAS",
      parentColumnSpace: 0,
      parentRowSpace: 0,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      isLoading: false,
    },
  };

  describe("Deselect", () => {
    it("returns an empty selection", () => {
      const result = deselectAll([]);

      expect(result).toStrictEqual([]);
    });
    it("will error out when request has any widgets", () => {
      expect(() => deselectAll(["any"])).toThrow("Wrong payload supplied");
    });
  });

  describe("Select One", () => {
    it("returns a selection", () => {
      const result = selectOneWidget(["widgetId"]);

      expect(result).toStrictEqual(["widgetId"]);
    });
    it("will error out when wrong payload supplied", () => {
      expect(() => selectOneWidget([])).toThrow("Wrong payload supplied");
      expect(() => selectOneWidget(["widgetId1", "widgetId2"])).toThrow(
        "Wrong payload supplied",
      );
    });
  });

  describe("Select Multiple", () => {
    it("returns a selection", () => {
      const result = selectMultipleWidgets(
        ["widgetId1", "widgetId2"],
        allWidgetsMock,
      );

      expect(result).toStrictEqual(["widgetId1", "widgetId2"]);
    });

    it("returns no selection if widgets are not siblings", () => {
      const result = selectMultipleWidgets(
        ["widgetId1", "widgetId3"],
        allWidgetsMock,
      );

      expect(result).toBeUndefined();
    });
  });

  describe("Shift Select", () => {
    it("forward selection", () => {
      const result = shiftSelectWidgets(
        ["w5"],
        ["w1", "w2", "w3", "w4", "w5"],
        ["w1"],
        "w1",
      );

      expect(result).toStrictEqual(["w1", "w5", "w2", "w3", "w4"]);
    });

    it("backwards selection", () => {
      const result = shiftSelectWidgets(
        ["w2"],
        ["w1", "w2", "w3", "w4", "w5"],
        ["w5"],
        "w5",
      );

      expect(result).toStrictEqual(["w5", "w2", "w3", "w4"]);
    });

    it("appended selection on overlap", () => {
      const result = shiftSelectWidgets(
        ["w1"],
        ["w1", "w2", "w3", "w4", "w5"],
        ["w5", "w3"],
        "w5",
      );

      expect(result).toStrictEqual(["w5", "w3", "w1", "w2", "w4"]);
    });

    it("a single selection when last selected is not a sibling", () => {
      const result = shiftSelectWidgets(
        ["w2"],
        ["w1", "w2", "w3", "w4", "w5"],
        ["w7"],
        "w7",
      );

      expect(result).toStrictEqual(["w2"]);
    });

    it("unselect when already selected", () => {
      const result = shiftSelectWidgets(
        ["w2"],
        ["w1", "w2", "w3", "w4", "w5"],
        ["w1", "w2"],
        "w2",
      );

      expect(result).toStrictEqual(["w1"]);
    });
  });
  describe("Push Pop Select", () => {
    it("adds a selection", () => {
      const result = pushPopWidgetSelection(
        ["w1"],
        ["w2", "w3"],
        ["w1", "w2", "w3"],
      );

      expect(result).toStrictEqual(["w2", "w3", "w1"]);
    });

    it("removes a selection", () => {
      const result = pushPopWidgetSelection(
        ["w1"],
        ["w2", "w1"],
        ["w1", "w2", "w3"],
      );

      expect(result).toStrictEqual(["w2"]);
    });

    it("removes other if new selection is not a sibling", () => {
      const result = pushPopWidgetSelection(["w1"], ["w3", "w4"], ["w1", "w2"]);

      expect(result).toStrictEqual(["w1"]);
    });
  });

  describe("UnSelect", () => {
    it("returns selection without the widget", () => {
      const result = unselectWidget(["w1"], ["w1", "w2", "w3"]);

      expect(result).toStrictEqual(["w2", "w3"]);
    });

    it("returns selection even if not selected", () => {
      const result = unselectWidget(["w1"], ["w2", "w3"]);

      expect(result).toStrictEqual(["w2", "w3"]);
    });
  });
});
