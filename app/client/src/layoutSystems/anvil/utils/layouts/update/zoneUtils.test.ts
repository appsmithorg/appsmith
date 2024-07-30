import { RenderModes } from "../../../../../constants/WidgetConstants";
import { mockButtonProps } from "../../../../../mocks/widgetProps/button";
import { isRedundantZoneWidget, isZoneWidget } from "./zoneUtils";

describe("isZoneWidget", () => {
  it("should return true if the widget is a zone widget", () => {
    // TODO: Use factory to generate widget
    const widget = {
      type: "ZONE_WIDGET",
      widgetId: "123",
      widgetName: "Button1",
      renderMode: RenderModes.CANVAS,
      version: 1,
      isLoading: false,
      parentColumnSpace: 10,
      parentRowSpace: 10,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 0,
      bottomRow: 4,
    };

    expect(isZoneWidget(widget)).toBe(true);
  });

  it("should return false if the widget is not a zone widget", () => {
    const widget = mockButtonProps();

    expect(isZoneWidget(widget)).toBe(false);
  });
});

describe("isRedundantZoneWidget", () => {
  it("should return true if the widget is a redundant zone widget", () => {
    const widget = {
      type: "ZONE_WIDGET",
      widgetId: "123",
      widgetName: "Zone1",
      renderMode: RenderModes.CANVAS,
      children: [],
      dynamicPropertyPathList: [],
      version: 1,
      isLoading: false,
      parentColumnSpace: 10,
      parentRowSpace: 10,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 0,
      bottomRow: 4,
    };

    const parentWidget = {
      type: "SECTION_WIDGET",
      widgetId: "567",
      widgetName: "Section1",
      renderMode: RenderModes.CANVAS,
      children: ["123"],
      version: 1,
      isLoading: false,
      parentColumnSpace: 10,
      parentRowSpace: 10,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 0,
      bottomRow: 4,
    };

    expect(isRedundantZoneWidget(widget, parentWidget)).toBe(true);
  });

  it("should return false if the widget is not empty", () => {
    const widget = {
      type: "ZONE_WIDGET",
      widgetId: "123",
      widgetName: "Zone1",
      renderMode: RenderModes.CANVAS,
      children: ["000"],
      dynamicPropertyPathList: [],
      version: 1,
      isLoading: false,
      parentColumnSpace: 10,
      parentRowSpace: 10,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 0,
      bottomRow: 4,
    };

    const parentWidget = {
      type: "SECTION_WIDGET",
      widgetId: "567",
      widgetName: "Section1",
      renderMode: RenderModes.CANVAS,
      children: ["123"],
      version: 1,
      isLoading: false,
      parentColumnSpace: 10,
      parentRowSpace: 10,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 0,
      bottomRow: 4,
    };

    expect(isRedundantZoneWidget(widget, parentWidget)).toBe(false);
  });

  it("should return false if the widget is not zone", () => {
    const widget = {
      type: "SECTION_WIDGET",
      widgetId: "567",
      widgetName: "Section1",
      renderMode: RenderModes.CANVAS,
      children: ["123"],
      version: 1,
      isLoading: false,
      parentColumnSpace: 10,
      parentRowSpace: 10,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 0,
      bottomRow: 4,
    };

    const parentWidget = {
      type: "SECTION_WIDGET",
      widgetId: "567",
      widgetName: "Section1",
      renderMode: RenderModes.CANVAS,
      children: ["123"],
      version: 1,
      isLoading: false,
      parentColumnSpace: 10,
      parentRowSpace: 10,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 0,
      bottomRow: 4,
    };

    expect(isRedundantZoneWidget(widget, parentWidget)).toBe(false);
  });

  it("should return false if the widget is not the only child", () => {
    const widget = {
      type: "ZONE_WIDGET",
      widgetId: "567",
      widgetName: "Section1",
      renderMode: RenderModes.CANVAS,
      children: ["123"],
      version: 1,
      isLoading: false,
      parentColumnSpace: 10,
      parentRowSpace: 10,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 0,
      bottomRow: 4,
    };

    const parentWidget = {
      type: "SECTION_WIDGET",
      widgetId: "567",
      widgetName: "Section1",
      renderMode: RenderModes.CANVAS,
      children: ["123", "877"],
      version: 1,
      isLoading: false,
      parentColumnSpace: 10,
      parentRowSpace: 10,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 0,
      bottomRow: 4,
    };

    expect(isRedundantZoneWidget(widget, parentWidget)).toBe(false);
  });

  it("should return false if the widget has JS props enabled", () => {
    const widget = {
      type: "ZONE_WIDGET",
      widgetId: "567",
      widgetName: "Section1",
      renderMode: RenderModes.CANVAS,
      children: ["123"],
      dynamicPropertyPathList: [{ key: "isVisible" }],
      version: 1,
      isLoading: false,
      parentColumnSpace: 10,
      parentRowSpace: 10,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 0,
      bottomRow: 4,
    };

    const parentWidget = {
      type: "SECTION_WIDGET",
      widgetId: "567",
      widgetName: "Section1",
      renderMode: RenderModes.CANVAS,
      children: ["123"],
      version: 1,
      isLoading: false,
      parentColumnSpace: 10,
      parentRowSpace: 10,
      leftColumn: 0,
      rightColumn: 10,
      topRow: 0,
      bottomRow: 4,
    };

    expect(isRedundantZoneWidget(widget, parentWidget)).toBe(false);
  });
});
