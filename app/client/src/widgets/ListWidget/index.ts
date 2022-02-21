import { cloneDeep, get, indexOf, isString } from "lodash";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";
import {
  BlueprintOperationTypes,
  FlattenedWidgetProps,
} from "widgets/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "List",
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
        updateDataTreePath: (parentProps: any, dataTreePath: string) => {
          return `${parentProps.widgetName}.template.${dataTreePath}`;
        },
        propertyUpdateHook: (
          parentProps: any,
          widgetName: string,
          propertyPath: string,
          propertyValue: string,
          isTriggerProperty: boolean,
        ) => {
          let value = propertyValue;

          if (!parentProps.widgetId) return [];

          const { jsSnippets, stringSegments } = getDynamicBindings(
            propertyValue,
          );

          const js = combineDynamicBindings(jsSnippets, stringSegments);

          value = `{{${parentProps.widgetName}.listData.map((currentItem, currentIndex) => {
              return (function(){
                return  ${js};
              })();
            })}}`;

          if (!js) {
            value = propertyValue;
          }

          const path = `template.${widgetName}.${propertyPath}`;

          return [
            {
              widgetId: parentProps.widgetId,
              propertyPath: path,
              propertyValue: isTriggerProperty ? propertyValue : value,
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
            let template = {};
            const logBlackListMap: any = {};
            const container = get(
              widgets,
              `${get(widget, "children.0.children.0")}`,
            );
            const canvas = get(widgets, `${get(container, "children.0")}`);
            let updatePropertyMap: any = [];
            const dynamicBindingPathList: any[] = get(
              widget,
              "dynamicBindingPathList",
              [],
            );

            canvas.children &&
              get(canvas, "children", []).forEach((child: string) => {
                const childWidget = cloneDeep(get(widgets, `${child}`));
                const logBlackList: { [key: string]: boolean } = {};
                const keys = Object.keys(childWidget);

                for (let i = 0; i < keys.length; i++) {
                  const key = keys[i];
                  let value = childWidget[key];

                  if (isString(value) && value.indexOf("currentItem") > -1) {
                    const { jsSnippets, stringSegments } = getDynamicBindings(
                      value,
                    );

                    const js = combineDynamicBindings(
                      jsSnippets,
                      stringSegments,
                    );

                    value = `{{${widget.widgetName}.listData.map((currentItem) => ${js})}}`;

                    childWidget[key] = value;

                    dynamicBindingPathList.push({
                      key: `template.${childWidget.widgetName}.${key}`,
                    });
                  }
                }

                Object.keys(childWidget).map((key) => {
                  logBlackList[key] = true;
                });

                logBlackListMap[childWidget.widgetId] = logBlackList;

                template = {
                  ...template,
                  [childWidget.widgetName]: childWidget,
                };
              });

            updatePropertyMap = [
              {
                widgetId: widget.widgetId,
                propertyName: "dynamicBindingPathList",
                propertyValue: dynamicBindingPathList,
              },
              {
                widgetId: widget.widgetId,
                propertyName: "template",
                propertyValue: template,
              },
            ];

            // add logBlackList to updateProperyMap for all children
            updatePropertyMap = updatePropertyMap.concat(
              Object.keys(logBlackListMap).map((logBlackListMapKey) => {
                return {
                  widgetId: logBlackListMapKey,
                  propertyName: "logBlackList",
                  propertyValue: logBlackListMap[logBlackListMapKey],
                };
              }),
            );

            return updatePropertyMap;
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
            const logBlackList: { [key: string]: boolean } = {};

            /*
             * Only widgets that don't have derived or meta properties
             * work well inside the current version of List widget.
             * Widgets like Input, Select maintain the state on meta properties,
             * which won't be available in List.selectedItem object. Hence we're
             * restricting them from being placed inside the List widget.
             */
            const allowedWidgets = [
              "AUDIO_WIDGET",
              "BUTTON_GROUP_WIDGET",
              "BUTTON_WIDGET",
              "CHART_WIDGET",
              "CHECKBOX_WIDGET",
              "CHECKBOX_GROUP_WIDGET",
              "CIRCULAR_PROGRESS_WIDGET",
              "DIVIDER_WIDGET",
              "ICON_BUTTON_WIDGET",
              "IFRAME_WIDGET",
              "IMAGE_WIDGET",
              "INPUT_WIDGET_V2",
              "MAP_CHART_WIDGET",
              "MAP_WIDGET",
              "MENU_BUTTON_WIDGET",
              "PROGRESSBAR_WIDGET",
              "STATBOX_WIDGET",
              "SWITCH_WIDGET",
              "SWITCH_GROUP_WIDGET",
              "TEXT_WIDGET",
              "VIDEO_WIDGET",
            ];

            if (indexOf(allowedWidgets, widget.type) === -1) {
              const widget = widgets[widgetId];
              if (widget.children && widget.children.length > 0) {
                widget.children.forEach((childId: string) => {
                  delete widgets[childId];
                });
              }
              if (widget.parentId) {
                const _parent = { ...widgets[widget.parentId] };
                _parent.children = _parent.children?.filter(
                  (id) => id !== widgetId,
                );
                widgets[widget.parentId] = _parent;
              }
              delete widgets[widgetId];

              return {
                widgets,
                message: `This widget cannot be used inside the list widget.`,
              };
            }

            const template = {
              ...get(parent, "template", {}),
              [widget.widgetName]: widget,
            };
            parent.template = template;

            // add logBlackList for the children being added
            Object.keys(widget).map((key) => {
              logBlackList[key] = true;
            });

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
