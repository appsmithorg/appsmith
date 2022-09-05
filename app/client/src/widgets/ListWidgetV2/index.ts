// TODO: Ashit - Add jest test for all the functions

import { klona } from "klona";
import { get, isString } from "lodash";
import { UpdatePropertyArgs } from "sagas/WidgetBlueprintSagas";

import { WidgetProps } from "widgets/BaseWidget";
import {
  BlueprintOperationTypes,
  FlattenedWidgetProps,
} from "widgets/constants";
import IconSVG from "./icon.svg";
import Widget, { DynamicPathList, ListWidgetProps } from "./widget";

const hasDynamicPath = (value: string) =>
  isString(value) && value.indexOf("currentItem") > -1;

// Widget properties that uses "currentItem" in the value.
const getDynamicPathList = (widget: WidgetProps) => {
  const propertyKeys: string[] = [];

  Object.keys(widget).forEach((propertyKey) => {
    const propertyValue = widget[propertyKey];
    if (hasDynamicPath(propertyValue)) {
      propertyKeys.push(propertyKey);
    }
  });

  return propertyKeys;
};

const getLogBlackList = (widget: WidgetProps) => {
  const logBlackList: Record<string, boolean> = {};

  Object.keys(widget).forEach((key) => {
    logBlackList[key] = true;
  });

  return logBlackList;
};

// Walk down template tree and add the widget in the parent's children
// const findAndUpdateTemplate = (widget: WidgetProps, template: Template) => {
//   if (template.widgetId === widget.parentId) {
//     template?.children?.push(widget);
//   } else {
//     template.children = template?.children?.map((childTemplate) =>
//       findAndUpdateTemplate(widget, childTemplate),
//     );
//   }

//   return template;
// };

// add blacklist to widget and create blacklist update map
// get internal properties for list
const computeWidgets = (
  widget: FlattenedWidgetProps,
  widgets: Record<string, FlattenedWidgetProps>,
  dynamicPathMap: DynamicPathList = {},
  childrenUpdatePropertyMap: UpdatePropertyArgs[] = [],
  // template: Record<string, FlattenedWidgetProps> = {},
) => {
  const clonedWidget = klona(widget);
  const logBlackList = getLogBlackList(widget);

  dynamicPathMap[widget.widgetId] = getDynamicPathList(widget);

  // TODO: (Ashit) - Remove logBlackList when widget moved out of list widget
  clonedWidget.logBlackList = logBlackList;

  childrenUpdatePropertyMap.push({
    widgetId: clonedWidget.widgetId,
    propertyName: "logBlackList",
    propertyValue: logBlackList,
  });

  // template[widget.widgetId] = widget;

  (widget.children || []).map((child) => {
    const childWidget = typeof child === "string" ? widgets[child] : child;

    computeWidgets(
      childWidget,
      widgets,
      dynamicPathMap,
      childrenUpdatePropertyMap,
      // template,
    );
  });

  return {
    // template,
    dynamicPathMap,
    childrenUpdatePropertyMap,
  };
};

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "List V2",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  defaults: {
    backgroundColor: "transparent",
    itemBackgroundColor: "#FFFFFF",
    rows: 40,
    columns: 24,
    animateLoading: true,
    gridType: "vertical",
    template: {},
    enhancements: {
      child: {
        autocomplete: (parentProps: any) => {
          return parentProps.childAutoComplete;
        },
        updateDataTreePath: (
          parentProps: ListWidgetProps<WidgetProps>,
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
        propertyUpdateHook: (
          parentProps: ListWidgetProps<WidgetProps>,
          widgetProperties: WidgetProps,
          propertyPath: string,
          propertyValue: string,
          isTriggerProperty: boolean,
        ) => {
          if (!parentProps.widgetId) return [];

          const dynamicPathMap = parentProps.dynamicPathMap
            ? klona(parentProps.dynamicPathMap)
            : {};

          if (!isTriggerProperty && hasDynamicPath(propertyValue)) {
            dynamicPathMap[widgetProperties.widgetId] = [
              ...dynamicPathMap[widgetProperties.widgetId],
              propertyPath,
            ];
          }

          return [
            {
              widgetId: parentProps.widgetId,
              propertyPath: "dynamicPathMap",
              propertyValue: dynamicPathMap,
              isDynamicTrigger: isTriggerProperty,
            },
          ];
        },
      },
    },
    gridGap: 0,
    listData: [
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
    ],
    widgetName: "List",
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
                    disablePropertyPane: true,
                    openParentPropertyPane: true,
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

            const {
              childrenUpdatePropertyMap,
              dynamicPathMap,
              // template,
            } = computeWidgets(mainCanvas, widgets);

            return [
              ...childrenUpdatePropertyMap,
              // {
              //   widgetId: widget.widgetId,
              //   propertyName: "template",
              //   propertyValue: template,
              // },
              {
                widgetId: widget.widgetId,
                propertyName: "dynamicPathMap",
                propertyValue: dynamicPathMap,
              },
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

            // parent.template = findAndUpdateTemplate(widget, parent.template);
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
  },
};

export default Widget;
