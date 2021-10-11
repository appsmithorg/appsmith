import { processDiff, TOASTS, FOCUSES, UPDATES, WIDGETS } from "./replayUtils";

describe("check processDiff from replayUtils for type of update", () => {
  const dsl = {
    "0": {},
    abcde: {
      widgetName: "abcde",
    },
  };
  describe("check diff of kind 'N' and 'D'", () => {
    it("should create toasts on creation of widgets on Undo", () => {
      const replay = {};
      const createWidgetDiff = {
        kind: "D",
        path: ["abcde"],
        lhs: {
          widgetName: "abcde",
        },
      };
      const createWidgetToast = {
        isCreated: true,
        isUndo: true,
        widgetName: "abcde",
        widgetId: "abcde",
      };

      processDiff(dsl, createWidgetDiff, replay, true);

      expect(replay[TOASTS]).toHaveLength(1);
      expect(replay[TOASTS][0]).toEqual(createWidgetToast);
    });

    it("should create toasts on creation of widgets on Redo", () => {
      const replay = {};
      const createWidgetDiff = {
        kind: "N",
        path: ["abcde"],
        rhs: {
          widgetName: "abcde",
        },
      };
      const createWidgetToast = {
        isCreated: true,
        isUndo: false,
        widgetName: "abcde",
        widgetId: "abcde",
      };

      processDiff(dsl, createWidgetDiff, replay, false);

      expect(replay[TOASTS]).toHaveLength(1);
      expect(replay[TOASTS][0]).toEqual(createWidgetToast);
    });
    it("should create toasts on deletion of widgets on Undo", () => {
      const replay = {};
      const deleteWidgetDiff = {
        kind: "N",
        path: ["abcde"],
        lhs: {
          widgetName: "abcde",
        },
      };
      const deleteWidgetToast = {
        isCreated: false,
        isUndo: true,
        widgetName: "abcde",
        widgetId: "abcde",
      };

      processDiff(dsl, deleteWidgetDiff, replay, true);

      expect(replay[TOASTS]).toHaveLength(1);
      expect(replay[TOASTS][0]).toEqual(deleteWidgetToast);
    });

    it("should create toasts on deletion of widgets on Redo", () => {
      const replay = {};
      const deleteWidgetDiff = {
        kind: "D",
        path: ["abcde"],
        rhs: {
          widgetName: "abcde",
        },
      };
      const deleteWidgetToast = {
        isCreated: false,
        isUndo: false,
        widgetName: "abcde",
        widgetId: "abcde",
      };

      processDiff(dsl, deleteWidgetDiff, replay, false);

      expect(replay[TOASTS]).toHaveLength(1);
      expect(replay[TOASTS][0]).toEqual(deleteWidgetToast);
    });
    it("should be considered PropertyUpdate when path length is more than 1 in kind 'N'", () => {
      const replay = {};
      const path = ["abcde", "test"];
      const updateWidgetDiff = {
        kind: "N",
        path: path,
      };

      processDiff(dsl, updateWidgetDiff, replay, true);

      expect(replay[UPDATES]).toBe(true);
      expect(Object.keys(replay[WIDGETS])).toHaveLength(1);
      expect(replay[WIDGETS].abcde[UPDATES]).toEqual(path);
    });
    it("should be considered PropertyUpdate when path length is more than 1 in kind 'D'", () => {
      const replay = {};
      const path = ["abcde", "test"];
      const updateWidgetDiff = {
        kind: "D",
        path: path,
      };

      processDiff(dsl, updateWidgetDiff, replay, true);

      expect(replay[UPDATES]).toBe(true);
      expect(Object.keys(replay[WIDGETS])).toHaveLength(1);
      expect(replay[WIDGETS].abcde[UPDATES]).toEqual(path);
    });
  });
  describe("check diff of kind 'E'", () => {
    it("should be considered as just a position update and needs focus if Base props change", () => {
      const replay = {};
      const updateWidgetDiff = {
        kind: "E",
        path: ["abcde", "topRow"],
      };

      processDiff(dsl, updateWidgetDiff, replay, true);

      expect(Object.keys(replay[WIDGETS])).toHaveLength(1);
      expect(replay[WIDGETS].abcde[FOCUSES]).toBe(true);
    });
    it("should be considered PropertyUpdate if custom widget props Change", () => {
      const replay = {};
      const path = ["abcde", "test"];
      const updateWidgetDiff = {
        kind: "E",
        path: path,
      };

      processDiff(dsl, updateWidgetDiff, replay, true);

      expect(replay[UPDATES]).toBe(true);
      expect(Object.keys(replay[WIDGETS])).toHaveLength(1);
      expect(replay[WIDGETS].abcde[UPDATES]).toEqual(path);
    });
  });
});
