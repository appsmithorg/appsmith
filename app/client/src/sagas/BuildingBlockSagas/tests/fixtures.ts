import type { WidgetAddChild } from "actions/pageActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { WidgetDraggingUpdateParams } from "layoutSystems/common/canvasArenas/ArenaTypes";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";

// Mock return value of getWidgetByName
export const skeletonWidget: FlattenedWidgetProps = {
  needsErrorInfo: false,
  mobileBottomRow: 69,
  widgetName: "loading_table_lookup",
  displayName: "Skeleton",
  topRow: 6,
  bottomRow: 69,
  parentRowSpace: 10,
  type: "SKELETON_WIDGET",
  hideCard: true,
  mobileRightColumn: 46,
  parentColumnSpace: 13.40625,
  leftColumn: 15,
  dynamicBindingPathList: [],
  key: "k0u7iidinm",
  isDeprecated: false,
  rightColumn: 46,
  widgetId: "ndw2y4zajv",
  onCanvasUI: {
    selectionBGCSSVar: "--on-canvas-ui-widget-selection",
    focusBGCSSVar: "--on-canvas-ui-widget-focus",
    selectionColorCSSVar: "--on-canvas-ui-widget-focus",
    focusColorCSSVar: "--on-canvas-ui-widget-selection",
    disableParentSelection: false,
  },
  isVisible: true,
  version: 1,
  parentId: "0",
  isLoading: false,
  renderMode: "CANVAS",
  mobileTopRow: 6,
  mobileLeftColumn: 15,
};

export const actionPayload: ReduxAction<{
  newWidget: WidgetAddChild;
  draggedBlocksToUpdate: WidgetDraggingUpdateParams[];
  canvasId: string;
}> = {
  type: "WIDGETS_ADD_CHILD_AND_MOVE",
  payload: {
    newWidget: {
      type: "BUILDING_BLOCK",
      leftColumn: 21,
      topRow: 147,
      columns: 31,
      rows: 63,
      parentRowSpace: 10,
      parentColumnSpace: 13.40625,
      newWidgetId: "9lg3rb7mi2",
      widgetId: "0",
      tabId: "0",
    },
    draggedBlocksToUpdate: [
      {
        left: 388.78125,
        top: 1430,
        width: 214.5,
        height: 40,
        columnWidth: 13.40625,
        rowHeight: 10,
        widgetId: "6b6kauwlxa",
        isNotColliding: true,
        type: "BUTTON_WIDGET",
        updateWidgetParams: {
          operation: "MOVE",
          widgetId: "6b6kauwlxa",
          payload: {
            leftColumn: 29,
            topRow: 143,
            bottomRow: 147,
            rightColumn: 45,
            parentId: "0",
            newParentId: "0",
          },
        },
      },
    ],
    canvasId: "0",
  },
};

export const addEntityAction: ReduxAction<WidgetAddChild> = {
  type: "WIDGET_ADD_CHILD",
  payload: {
    widgetId: "0",
    type: "BUILDING_BLOCK",
    leftColumn: 15,
    topRow: 6,
    columns: 31,
    rows: 63,
    parentRowSpace: 10,
    parentColumnSpace: 13.40625,
    newWidgetId: "ndw2y4zajv",
    tabId: "0",
  },
};
