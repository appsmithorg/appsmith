import { get } from "lodash";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import { DynamicHeight, RegisteredWidgetFeatures } from "utils/WidgetFeatures";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  getNumberOfChildListWidget,
  getNumberOfParentListWidget,
} from "./helper";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";
import { GridDefaults } from "constants/WidgetConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  FlexLayerAlignment,
  FlexVerticalAlignment,
  Positioning,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";
import { LayoutSystemTypes } from "layoutSystems/types";

const DEFAULT_LIST_DATA = [
  {
    id: "001",
    name: "Blue",
    img: getAssetUrl(`${ASSETS_CDN_URL}/widgets/default.png`),
  },
  {
    id: "002",
    name: "Green",
    img: getAssetUrl(`${ASSETS_CDN_URL}/widgets/default.png`),
  },
  {
    id: "003",
    name: "Red",
    img: getAssetUrl(`${ASSETS_CDN_URL}/widgets/default.png`),
  },
];

const LIST_WIDGET_NESTING_ERROR =
  "Cannot have more than 3 levels of nesting in the list widget";

export default {
  backgroundColor: "transparent",
  itemBackgroundColor: "#FFFFFF",
  requiresFlatWidgetChildren: true,
  hasMetaWidgets: true,
  rows: 40,
  columns: 24,
  animateLoading: true,
  gridType: "vertical",
  //positioning: Positioning.Fixed,
  minWidth: FILL_WIDGET_MIN_WIDTH,
  responsiveBehavior: ResponsiveBehavior.Fill,
  flexVerticalAlignment: FlexVerticalAlignment.Top,
  dynamicBindingPathList: [
    {
      key: "currentItemsView",
    },
    {
      key: "selectedItemView",
    },
    {
      key: "triggeredItemView",
    },
    {
      key: "primaryKeys",
    },
  ],
  currentItemsView: "{{[]}}",
  selectedItemView: "{{{}}}",
  triggeredItemView: "{{{}}}",
  enhancements: {
    child: {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      autocomplete: (parentProps: any) => {
        return parentProps.childAutoComplete;
      },
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shouldHideProperty: (parentProps: any, propertyName: string) => {
        if (propertyName === "dynamicHeight") return true;

        return false;
      },
    },
  },
  itemSpacing: 8,
  templateHeight: 160,
  listData: DEFAULT_LIST_DATA,
  pageSize: DEFAULT_LIST_DATA.length,
  widgetName: "List",
  children: [],
  additionalStaticProps: [
    "level",
    "levelData",
    "prefixMetaWidgetId",
    "metaWidgetId",
  ],
  primaryKeys:
    '{{List1.listData.map((currentItem, currentIndex) => currentItem["id"] )}}',
  blueprint: {
    view: [
      {
        type: "CANVAS_WIDGET",
        position: { top: 0, left: 0 },
        props: {
          containerStyle: "none",
          canExtend: false,
          detachFromLayout: true,
          dropDisabled: true,
          openParentPropertyPane: true,
          noPad: true,
          children: [],
          blueprint: {
            view: [
              {
                type: "CONTAINER_WIDGET",
                size: {
                  rows: 12,
                  cols: 64,
                },
                position: { top: 0, left: 0 },
                props: {
                  backgroundColor: "white",
                  containerStyle: "card",
                  dragDisabled: true,
                  isDeletable: false,
                  isListItemContainer: true,
                  disallowCopy: true,
                  noContainerOffset: true,
                  positioning: Positioning.Fixed,
                  disabledWidgetFeatures: [
                    RegisteredWidgetFeatures.DYNAMIC_HEIGHT,
                  ],
                  shouldScrollContents: false,
                  dynamicHeight: "FIXED",
                  children: [],
                  blueprint: {
                    view: [
                      {
                        type: "CANVAS_WIDGET",
                        position: { top: 0, left: 0 },
                        props: {
                          containerStyle: "none",
                          canExtend: false,
                          detachFromLayout: true,
                          children: [],
                          version: 1,
                          useAutoLayout: false,
                          blueprint: {
                            view: [
                              {
                                type: "IMAGE_WIDGET",
                                size: {
                                  rows: 8,
                                  cols: 16,
                                },
                                position: { top: 0, left: 0 },
                                props: {
                                  defaultImage: getAssetUrl(
                                    `${ASSETS_CDN_URL}/widgets/default.png`,
                                  ),
                                  imageShape: "RECTANGLE",
                                  maxZoomLevel: 1,
                                  image: "{{currentItem.img}}",
                                  boxShadow: "none",
                                  objectFit: "cover",
                                  dynamicBindingPathList: [
                                    {
                                      key: "image",
                                    },
                                  ],
                                  dynamicTriggerPathList: [],
                                },
                              },
                              {
                                type: "TEXT_WIDGET",
                                size: {
                                  rows: 4,
                                  cols: 12,
                                },
                                position: {
                                  top: 0,
                                  left: 16,
                                },
                                props: {
                                  text: "{{currentItem.name}}",
                                  textStyle: "HEADING",
                                  textAlign: "LEFT",
                                  boxShadow: "none",
                                  dynamicBindingPathList: [
                                    {
                                      key: "text",
                                    },
                                  ],
                                  dynamicTriggerPathList: [],
                                  dynamicHeight: "FIXED",
                                },
                              },
                              {
                                type: "TEXT_WIDGET",
                                size: {
                                  rows: 4,
                                  cols: 8,
                                },
                                position: {
                                  top: 4,
                                  left: 16,
                                },
                                props: {
                                  text: "{{currentItem.id}}",
                                  textStyle: "BODY",
                                  textAlign: "LEFT",
                                  boxShadow: "none",
                                  dynamicBindingPathList: [
                                    {
                                      key: "text",
                                    },
                                  ],
                                  dynamicTriggerPathList: [],
                                  dynamicHeight: "FIXED",
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
    ],
    operations: [
      {
        type: BlueprintOperationTypes.MODIFY_PROPS,
        fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
          // List > Canvas > Container > Canvas > Widgets
          const mainCanvas = get(widget, "children.0");
          const containerId = get(widget, "children.0.children.0");
          const { widgetName } = widget;
          const primaryKeys = `{{${widgetName}.listData.map((currentItem, currentIndex) => currentItem["id"] )}}`;

          return [
            {
              widgetId: widget.widgetId,
              propertyName: "mainContainerId",
              propertyValue: containerId,
            },
            {
              widgetId: widget.widgetId,
              propertyName: "mainCanvasId",
              propertyValue: mainCanvas.widgetId,
            },
            {
              widgetId: widget.widgetId,
              propertyName: "primaryKeys",
              propertyValue: primaryKeys,
            },
          ];
        },
      },
      {
        type: BlueprintOperationTypes.MODIFY_PROPS,
        fn: (
          widget: FlattenedWidgetProps,
          widgets: CanvasWidgetsReduxState,
          parent: FlattenedWidgetProps,
          layoutSystemType: LayoutSystemTypes,
        ) => {
          if (layoutSystemType !== LayoutSystemTypes.AUTO) {
            return [];
          }

          const firstCanvas = get(widget, "children.0");

          //get first container widget
          const containerId = get(widget, "children.0.children.0");
          const containerWidget = widgets[containerId];

          //get first Canvas Widget inside the container
          const canvasId = get(containerWidget, "children.0");
          const canvasWidget: FlattenedWidgetProps = widgets[canvasId];

          //get Children inside Canvas
          const childrenIds: string[] = get(canvasWidget, "children") || [];
          const children: FlattenedWidgetProps[] = childrenIds.map(
            (childId) => widgets[childId],
          );

          //Separate the text widget and image widget
          const textWidgets = children.filter(
            (child) => child.type === "TEXT_WIDGET",
          );
          const imageWidget = children.filter(
            (child) => child.type === "IMAGE_WIDGET",
          )?.[0];

          //Create flex layer object based on the children
          const flexLayers: FlexLayer[] = [
            {
              children: [
                {
                  id: textWidgets[0].widgetId,
                  align: FlexLayerAlignment.Start,
                },
                {
                  id: imageWidget.widgetId,
                  align: FlexLayerAlignment.End,
                },
              ],
            },
            {
              children: [
                {
                  id: textWidgets[1].widgetId,
                  align: FlexLayerAlignment.Start,
                },
              ],
            },
          ];

          const firstCanvasFlexLayers: FlexLayer[] = [
            {
              children: [
                {
                  id: containerId,
                  align: FlexLayerAlignment.Center,
                },
              ],
            },
          ];

          //create properties to be updated
          return getWidgetBluePrintUpdates({
            [firstCanvas.widgetId]: {
              flexLayers: firstCanvasFlexLayers,
              positioning: Positioning.Vertical,
            },
            [containerId]: {
              positioning: Positioning.Vertical,
              isFlexChild: true,
              bottomRow: 13,
            },
            [canvasWidget.widgetId]: {
              flexLayers,
              useAutoLayout: true,
              positioning: Positioning.Vertical,
            },
            [textWidgets[0].widgetId]: {
              responsiveBehavior: ResponsiveBehavior.Fill,
              alignment: FlexLayerAlignment.Start,
              leftColumn: 0,
              rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 16,
              dynamicHeight: DynamicHeight.AUTO_HEIGHT,
            },
            [textWidgets[1].widgetId]: {
              responsiveBehavior: ResponsiveBehavior.Fill,
              alignment: FlexLayerAlignment.Start,
              leftColumn: 0,
              rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
              dynamicHeight: DynamicHeight.AUTO_HEIGHT,
            },
            [imageWidget.widgetId]: {
              responsiveBehavior: ResponsiveBehavior.Hug,
              alignment: FlexLayerAlignment.End,
              topRow: 0,
              bottomRow: 6,
              leftColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 16,
              rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
              widthInPercentage: 16 / GridDefaults.DEFAULT_GRID_COLUMNS,
            },
          });
        },
      },
      {
        type: BlueprintOperationTypes.CHILD_OPERATIONS,
        fn: (
          widgets: { [widgetId: string]: FlattenedWidgetProps },
          widgetId: string,
          parentId: string,
          widgetPropertyMaps: { defaultPropertyMap: Record<string, string> },
          layoutSystemType: LayoutSystemTypes,
        ) => {
          if (!parentId) return { widgets };
          const widget = { ...widgets[widgetId] };

          widget.dynamicHeight = DynamicHeight.FIXED;

          if (layoutSystemType === LayoutSystemTypes.AUTO) {
            widget.dynamicHeight = DynamicHeight.AUTO_HEIGHT;
          }

          widgets[widgetId] = widget;
          return { widgets };
        },
      },
      {
        type: BlueprintOperationTypes.BEFORE_ADD,
        fn: (
          widgets: { [widgetId: string]: FlattenedWidgetProps },
          widgetId: string,
          parentId: string,
        ) => {
          const numOfParentListWidget = getNumberOfParentListWidget(
            parentId,
            widgets,
          );

          if (numOfParentListWidget >= 3) {
            throw Error(LIST_WIDGET_NESTING_ERROR);
          }

          return numOfParentListWidget;
        },
      },
      {
        type: BlueprintOperationTypes.BEFORE_PASTE,
        fn: (
          widgets: { [widgetId: string]: FlattenedWidgetProps },
          widgetId: string,
          parentId: string,
        ) => {
          const numOfParentListWidget = getNumberOfParentListWidget(
            parentId,
            widgets,
          );
          const numOfChildListWidget = getNumberOfChildListWidget(
            widgetId,
            widgets,
          );

          if (numOfParentListWidget + numOfChildListWidget > 3) {
            throw Error(LIST_WIDGET_NESTING_ERROR);
          }
        },
      },

      {
        type: BlueprintOperationTypes.BEFORE_DROP,
        fn: (
          widgets: { [widgetId: string]: FlattenedWidgetProps },
          widgetId: string,
          parentId: string,
        ) => {
          const numOfParentListWidget = getNumberOfParentListWidget(
            parentId,
            widgets,
          );
          const numOfChildListWidget = getNumberOfChildListWidget(
            widgetId,
            widgets,
          );

          if (numOfParentListWidget + numOfChildListWidget > 3) {
            throw Error(LIST_WIDGET_NESTING_ERROR);
          }
        },
      },
    ],
  },
};
