import { mockButtonProps } from "../../../../mocks/widgetProps/button";
import {
  hasWidgetJsPropertiesEnabled,
  isEmptyWidget,
  widgetChildren,
} from "./widgetUtils";

describe("isEmptyWidget", () => {
  it("should return true if the widget is empty", () => {
    const widget = {
      ...mockButtonProps(),
      children: [],
    };

    expect(isEmptyWidget(widget)).toBe(true);
  });

  it("should return true if children are undefined", () => {
    const widget = {
      ...mockButtonProps(),
      children: undefined,
    };

    expect(isEmptyWidget(widget)).toBe(true);
  });

  it("should return false if the widget is not empty", () => {
    const widget = {
      ...mockButtonProps(),
      children: ["1"],
    };

    expect(isEmptyWidget(widget)).toBe(false);
  });
});

describe("widgetChildren", () => {
  it("should return children of the widget", () => {
    const widget = {
      ...mockButtonProps(),
      children: ["1", "2"],
    };

    expect(widgetChildren(widget)).toEqual(["1", "2"]);
  });

  it("should return an empty array if children are undefined", () => {
    const widget = {
      ...mockButtonProps(),
      children: undefined,
    };

    expect(widgetChildren(widget)).toEqual([]);
  });
});

describe("hasWidgetJsPropertiesEnabled", () => {
  it("should return true if the widget has enabled widget JS properties", () => {
    const widget = {
      ...mockButtonProps(),
      dynamicPropertyPathList: [{ key: "isVisible" }],
    };

    expect(hasWidgetJsPropertiesEnabled(widget)).toBe(true);
  });

  it("should return false if the widget does not have enabled widget JS properties", () => {
    const widget = {
      ...mockButtonProps(),
      dynamicPropertyPathList: [],
    };
    expect(hasWidgetJsPropertiesEnabled(widget)).toBe(false);
  });

  it("should return false if the widget has undefined dynamicPropertyPathList", () => {
    const widget = {
      ...mockButtonProps(),
      dynamicPropertyPathList: undefined,
    };
    expect(hasWidgetJsPropertiesEnabled(widget)).toBe(false);
  });
});
