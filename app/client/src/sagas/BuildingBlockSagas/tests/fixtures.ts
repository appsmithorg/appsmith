import type { WidgetAddChild } from "actions/pageActions";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import type { WidgetDraggingUpdateParams } from "layoutSystems/common/canvasArenas/ArenaTypes";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { PaginationType, PluginType, type Action } from "entities/Action";

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

export const newlyCreatedActions: Action[] = [
  {
    id: "6673f0a0b64fdc719809bf28",
    baseId: "6673f0a0b64fdc719809bf29",
    workspaceId: "6672debbb64fdc719809bf05",
    applicationId: "6672debbb64fdc719809b111",
    cacheResponse: "",
    pluginType: PluginType.DB,
    pluginId: "667115877cb2c839782babdd",
    name: "fetch_users5",
    datasource: {
      id: "6673d7cdb64fdc719809bf19",
      name: "Sample Database",
      pluginId: "667115877cb2c839782babdd",
    },
    pageId: "6673d78fb64fdc719809bf17",
    actionConfiguration: {
      timeoutInMillisecond: 10000,
      paginationType: PaginationType.NONE,
      body: 'SELECT * FROM user_data WHERE name ILIKE \'{{"%" + (tbl_usersCopy4.searchText || "") + "%"}}',
      pluginSpecifiedTemplates: [
        {
          value: false,
        },
      ],
    },
    executeOnLoad: true,
    dynamicBindingPathList: [
      {
        key: "body",
      },
    ],
    isValid: true,
    invalids: [],
    messages: [],
    jsonPathKeys: [
      "dat_bornAfterCopy4.selectedDate",
      '"%" + (tbl_usersCopy4.searchText || "") + "%"',
      "tbl_usersCopy4.pageOffset",
      'sel_countryCopy4.selectedOptionValue !== "" ? "AND country = \'" + sel_countryCopy4.selectedOptionValue + "\'" : ""',
      "tbl_usersCopy4.pageSize - 1",
    ],
    confirmBeforeExecute: false,
    userPermissions: [
      "read:actions",
      "delete:actions",
      "execute:actions",
      "manage:actions",
    ],
  },
];
