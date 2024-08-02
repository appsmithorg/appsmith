import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { LayoutComponentTypes } from "../../anvilTypes";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

export function generateMockDataWithSectionAndZone() {
  const mockWidgetId = "widget-mock";
  const mockSectionId = "section-mock";
  const mockZoneId = "zone-mock";
  const alignedRowWithWidgets = {
    layoutType: LayoutComponentTypes.ALIGNED_WIDGET_ROW,
    layout: [
      {
        alignment: FlexLayerAlignment.Start,
        widgetId: mockWidgetId,
        widgetType: "WDS_BUTTON_WIDGET",
      },
    ],
  };
  const zoneLayout = {
    layoutType: LayoutComponentTypes.ZONE,
    layout: [alignedRowWithWidgets],
  };
  const sectionLayout = {
    layoutType: LayoutComponentTypes.SECTION,
    layout: [
      {
        widgetId: mockZoneId,
        alignment: FlexLayerAlignment.Start,
        widgetType: "ZONE_WIDGET",
      },
    ],
  };
  const mainCanvasLayout = {
    layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
    layout: [
      {
        layoutType: LayoutComponentTypes.WIDGET_ROW,
        layout: [
          {
            widgetId: mockSectionId,
            alignment: FlexLayerAlignment.Start,
            widgetType: "SECTION_WIDGET",
          },
        ],
      },
    ],
  };
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allWidgets: any = {
    [mockWidgetId]: {
      widgetId: mockWidgetId,
      type: "WDS_BUTTON_WIDGET",
      parentId: mockZoneId,
    },
    [mockZoneId]: {
      widgetId: mockZoneId,
      type: "ZONE_WIDGET",
      parentId: mockSectionId,
      layout: [zoneLayout],
    },
    [mockSectionId]: {
      widgetId: mockSectionId,
      type: "SECTION_WIDGET",
      parentId: MAIN_CONTAINER_WIDGET_ID,
      layout: [sectionLayout],
    },
    [MAIN_CONTAINER_WIDGET_ID]: {
      widgetId: MAIN_CONTAINER_WIDGET_ID,
      type: "MAIN_CONTAINER",
      parentId: "",
      layout: [mainCanvasLayout],
    },
  };
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const copiedWidgets: any = [
    {
      list: [allWidgets[mockWidgetId]],
      hierarchy: 4,
    },
  ];
  return {
    allWidgets,
    copiedWidgets,
    mockWidgetId,
    mockSectionId,
    mockZoneId,
  };
}
