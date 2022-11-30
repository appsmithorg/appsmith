// TODO: Ashit - Add jest test for all the functions

import { klona } from "klona";
import { get } from "lodash";
import { UpdatePropertyArgs } from "sagas/WidgetBlueprintSagas";

import { WidgetProps } from "widgets/BaseWidget";
import {
  BlueprintOperationTypes,
  FlattenedWidgetProps,
} from "widgets/constants";
import IconSVG from "./icon.svg";
import Widget, { ListWidgetProps } from "./widget";

const getLogBlackList = (widget: WidgetProps) => {
  const logBlackList: Record<string, boolean> = {};

  Object.keys(widget).forEach((key) => {
    logBlackList[key] = true;
  });

  return logBlackList;
};

const computeWidgets = (
  widget: FlattenedWidgetProps,
  widgets: Record<string, FlattenedWidgetProps>,
  childrenUpdatePropertyMap: UpdatePropertyArgs[] = [],
) => {
  const clonedWidget = klona(widget);
  const logBlackList = getLogBlackList(widget);

  // TODO: (Ashit) - Remove logBlackList when widget moved out of list widget
  clonedWidget.logBlackList = logBlackList;

  childrenUpdatePropertyMap.push({
    widgetId: clonedWidget.widgetId,
    propertyName: "logBlackList",
    propertyValue: logBlackList,
  });

  (widget.children || []).map((child) => {
    const childWidget = typeof child === "string" ? widgets[child] : child;

    computeWidgets(childWidget, widgets, childrenUpdatePropertyMap);
  });

  return {
    childrenUpdatePropertyMap,
  };
};

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

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "List V2",
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
    dynamicBindingPathList: [
      {
        key: "currentViewRows",
      },
      {
        key: "selectedRow",
      },
      {
        key: "triggeredRow",
      },
      {
        key: "primaryKeys",
      },
    ],
    currentViewRows: "{{[]}}",
    selectedRow: "{{{}}}",
    triggeredRow: "{{{}}}",
    enhancements: {
      child: {
        autocomplete: (parentProps: any) => {
          return parentProps.childAutoComplete;
        },
        // TODO: (Ashit) - Remove this enhancement. Probably not required for V2
        updateDataTreePath: (
          parentProps: ListWidgetProps,
          dataTreePath: string,
        ) => {
          const pathChunks = dataTreePath.split(".");
          const widgetName = pathChunks[0];
          const path = pathChunks.slice(1, pathChunks.length).join(".");
          const { flattenedChildCanvasWidgets = {} } = parentProps;

          const templateWidget = Object.values(
            flattenedChildCanvasWidgets,
          ).find((w) => w.widgetName === widgetName);

          return `${parentProps.widgetName}.template.${templateWidget?.widgetId}.${path}`;
        },
      },
    },
    gridGap: 0,
    templateBottomRow: 16,
    listData: DEFAULT_LIST_DATA,
    pageSize: DEFAULT_LIST_DATA.length,
    widgetName: "List",
    children: [],
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
          fn: (
            widget: WidgetProps & { children?: WidgetProps[] },
            widgets: { [widgetId: string]: FlattenedWidgetProps },
          ) => {
            // List > Canvas > Container > Canvas > Widgets
            const mainCanvas = get(widget, "children.0");
            const containerId = get(widget, "children.0.children.0");
            const { widgetName } = widget;
            const primaryKeys = `{{${widgetName}.listData.map((currentItem, currentIndex) => currentItem["id"] )}}`;

            const { childrenUpdatePropertyMap } = computeWidgets(
              mainCanvas,
              widgets,
            );

            return [
              ...childrenUpdatePropertyMap,

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
            const parent = { ...widgets[parentId] };
            const logBlackList = getLogBlackList(widget);

            widget.logBlackList = logBlackList;

            widgets[parentId] = parent;
            widgets[widgetId] = widget;

            return { widgets };
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
  },
};

export default Widget;
