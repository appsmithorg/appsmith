import { generateReactKey } from "@shared/dsl/src/migrate/utils";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { LayoutComponentTypes } from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

export const generateMockDataWithTwoSections = () => {
  const mainCanvasLayoutId = generateReactKey();
  const section1Id = generateReactKey();
  const section2Id = generateReactKey();
  const zone1Id = generateReactKey();
  const zone2Id = generateReactKey();
  const section1Layout = {
    layoutType: LayoutComponentTypes.SECTION,
    layout: [
      {
        widgetId: zone1Id,
        alignment: FlexLayerAlignment.Start,
        widgetType: "ZONE_WIDGET",
      },
    ],
  };
  const section2Layout = {
    layoutType: LayoutComponentTypes.SECTION,
    layout: [
      {
        widgetId: zone2Id,
        alignment: FlexLayerAlignment.Start,
        widgetType: "ZONE_WIDGET",
      },
    ],
  };
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allWidgets: any = {
    [MAIN_CONTAINER_WIDGET_ID]: {
      widgetName: "Main Container",
      widgetId: MAIN_CONTAINER_WIDGET_ID,
      children: [section1Id, section2Id],
      layout: [
        {
          layoutId: mainCanvasLayoutId,
          layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
          childTemplate: {
            insertChild: true,
            layoutId: "",
            layoutType: LayoutComponentTypes.WIDGET_ROW,
            layout: [],
          },
          layout: [
            {
              layoutType: LayoutComponentTypes.WIDGET_ROW,
              layout: [
                {
                  widgetId: section1Id,
                  alignment: FlexLayerAlignment.Start,
                  widgetType: "SECTION_WIDGET",
                },
              ],
            },
            {
              layoutType: LayoutComponentTypes.WIDGET_ROW,
              layout: [
                {
                  widgetId: section2Id,
                  alignment: FlexLayerAlignment.Start,
                  widgetType: "SECTION_WIDGET",
                },
              ],
            },
          ],
        },
      ],
    },
    [section1Id]: {
      widgetName: "Section 1",
      type: "SECTION_WIDGET",
      widgetId: section1Id,
      children: [zone1Id],
      layout: [section1Layout],
      zoneCount: 1,
      parentId: MAIN_CONTAINER_WIDGET_ID,
    },
    [section2Id]: {
      widgetName: "Section 2",
      type: "SECTION_WIDGET",
      widgetId: section2Id,
      children: [zone2Id],
      layout: [section2Layout],
      zoneCount: 1,
      parentId: MAIN_CONTAINER_WIDGET_ID,
    },
    [zone1Id]: {
      widgetName: "Zone 1",
      type: "ZONE_WIDGET",
      widgetId: zone1Id,
      children: [],
      parentId: section1Id,
    },
    [zone2Id]: {
      widgetName: "Zone 2",
      type: "ZONE_WIDGET",
      widgetId: zone2Id,
      children: [],
      parentId: section2Id,
    },
  };
  return {
    allWidgets,
    mainCanvasLayoutId,
    section1Id,
    section2Id,
    zone1Id,
    zone2Id,
  };
};
