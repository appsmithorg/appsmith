import { WidgetNameState } from "./WidgetNameConstants";
import type { WidgetNameData } from "./WidgetNameTypes";
import { hasWidgetNameDataChanged } from "./utils";

const existingRef = {
  selected: {
    id1: {
      height: 100,
      width: 100,
      left: 10,
      top: 10,
      widgetNameData: {
        id: "id1",
        widgetName: "test1",
        parentId: "parentId1",
        dragDisabled: false,
        nameState: WidgetNameState.SELECTED,
        position: { height: 100, width: 100, left: 10, top: 10 },
      },
    },
  },
  focused: {
    id1: {
      height: 100,
      width: 100,
      left: 10,
      top: 10,
      widgetNameData: {
        id: "id1",
        widgetName: "test1",
        parentId: "parentId1",
        dragDisabled: false,
        nameState: WidgetNameState.FOCUSED,
        position: { height: 100, width: 100, left: 10, top: 10 },
      },
    },
  },
};

describe("Should recompute widget names", () => {
  it("should return true if the focused element has changed", () => {
    const selected: WidgetNameData[] = [
      existingRef.selected["id1"].widgetNameData,
    ];
    const focused = {
      id: "id2",
      widgetName: "test1",
      parentId: "parentId1",
      dragDisabled: false,
      nameState: WidgetNameState.FOCUSED,
      position: { height: 100, width: 100, left: 10, top: 10 },
    };
    const result = hasWidgetNameDataChanged(existingRef, selected, focused);
    expect(result).toBeTruthy();
  });

  it("should return true if selected element id changes", () => {
    const selected = [
      {
        id: "id2",
        widgetName: "test1",
        parentId: "parentId1",
        dragDisabled: false,
        nameState: WidgetNameState.SELECTED,
        position: { height: 100, width: 100, left: 10, top: 10 },
      },
    ];
    const focused = {
      id: "id1",
      widgetName: "test1",
      parentId: "parentId1",
      dragDisabled: false,
      nameState: WidgetNameState.FOCUSED,
      position: { height: 100, width: 100, left: 10, top: 10 },
    };
    const result = hasWidgetNameDataChanged(existingRef, selected, focused);
    expect(result).toBeTruthy();
  });

  it("should return true if selected element data changes", () => {
    const selected = [
      {
        id: "id1",
        widgetName: "test1",
        parentId: "parentId1",
        dragDisabled: false,
        nameState: WidgetNameState.SELECTED,
        position: { height: 200, width: 200, left: 20, top: 20 },
      },
    ];
    const focused = {
      id: "id1",
      widgetName: "test1",
      parentId: "parentId1",
      dragDisabled: false,
      nameState: WidgetNameState.FOCUSED,
      position: { height: 100, width: 100, left: 10, top: 10 },
    };
    const result = hasWidgetNameDataChanged(existingRef, selected, focused);
    expect(result).toBeTruthy();
  });

  it("should return false if no changes are detected", () => {
    const selected = [
      {
        id: "id1",
        widgetName: "test1",
        parentId: "parentId1",
        dragDisabled: false,
        nameState: WidgetNameState.SELECTED,
        position: { height: 100, width: 100, left: 10, top: 10 },
      },
    ];
    const focused = {
      id: "id1",
      widgetName: "test1",
      parentId: "parentId1",
      dragDisabled: false,
      nameState: WidgetNameState.FOCUSED,
      position: { height: 100, width: 100, left: 10, top: 10 },
    };
    const result = hasWidgetNameDataChanged(existingRef, selected, focused);
    expect(result).toBeFalsy();
  });
});
