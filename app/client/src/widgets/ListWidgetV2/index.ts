import { get } from "lodash";

import IconSVG from "./icon.svg";
import Widget from "./widget";
import {
  BlueprintOperationTypes,
  FlattenedWidgetProps,
} from "widgets/constants";
import { RegisteredWidgetFeatures } from "utils/WidgetFeatures";
import { WidgetProps } from "widgets/BaseWidget";
import {
  getNumberOfChildListWidget,
  getNumberOfParentListWidget,
} from "./widget/helper";
import { Positioning, ResponsiveBehavior } from "utils/autoLayout/constants";

const DEFAULT_LIST_DATA = [
  {
    id: "001",
    name: "Blue",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "002",
    name: "Green",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "003",
    name: "Red",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
];

const LIST_WIDGET_NESTING_ERROR =
  "Cannot have more than 3 levels of nesting in the list widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "List",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  defaults: {
    backgroundColor: "transparent",
    itemBackgroundColor: "#FFFFFF",
    requiresFlatWidgetChildren: true,
    hasMetaWidgets: true,
    rows: 40,
    columns: 24,
    animateLoading: true,
    gridType: "vertical",
    positioning: Positioning.Fixed,
    responsiveBehavior: ResponsiveBehavior.Fill,
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
        autocomplete: (parentProps: any) => {
          return parentProps.childAutoComplete;
        },
        shouldHideProperty: (parentProps: any, propertyName: string) => {
          if (propertyName === "dynamicHeight") return true;

          return false;
        },
      },
    },
    itemSpacing: 8,
    templateBottomRow: 16,
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
                                    defaultImage:
                                      "https://assets.appsmith.com/widgets/default.png",
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
          type: BlueprintOperationTypes.CHILD_OPERATIONS,
          fn: (
            widgets: { [widgetId: string]: FlattenedWidgetProps },
            widgetId: string,
            parentId: string,
          ) => {
            if (!parentId) return { widgets };
            const widget = { ...widgets[widgetId] };

            widget.dynamicHeight = "FIXED";

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
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
  },
};

export default Widget;
