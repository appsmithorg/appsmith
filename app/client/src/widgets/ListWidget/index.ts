import Widget from "./widget";
import IconSVG from "./icon.svg";
import {
  BlueprintOperationTypes,
  FlattenedWidgetProps,
  GRID_DENSITY_MIGRATION_V1,
} from "widgets/constants";
import { WidgetProps } from "widgets/BaseWidget";
import { cloneDeep, get, indexOf, isString } from "lodash";

import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "List",
  iconSVG: IconSVG,
  needsMeta: true,
  isCanvas: true,
  defaults: {
    backgroundColor: "transparent",
    itemBackgroundColor: "#FFFFFF",
    rows: 10 * GRID_DENSITY_MIGRATION_V1,
    columns: 6 * GRID_DENSITY_MIGRATION_V1,
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
        name: "Bulbasaur",
        img: "http://www.serebii.net/pokemongo/pokemon/001.png",
      },
      {
        id: "002",
        name: "Ivysaur",
        img: "http://www.serebii.net/pokemongo/pokemon/002.png",
      },
      {
        id: "003",
        name: "Venusaur",
        img: "http://www.serebii.net/pokemongo/pokemon/003.png",
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
                    rows: 3 * GRID_DENSITY_MIGRATION_V1,
                    cols: 16 * GRID_DENSITY_MIGRATION_V1,
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
                                    rows: 2.1 * GRID_DENSITY_MIGRATION_V1,
                                    cols: 4 * GRID_DENSITY_MIGRATION_V1,
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
                                    rows: 1 * GRID_DENSITY_MIGRATION_V1,
                                    cols: 3 * GRID_DENSITY_MIGRATION_V1,
                                  },
                                  position: {
                                    top: 0,
                                    left: 4 * GRID_DENSITY_MIGRATION_V1,
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
                                    rows: 1 * GRID_DENSITY_MIGRATION_V1,
                                    cols: 2 * GRID_DENSITY_MIGRATION_V1,
                                  },
                                  position: {
                                    top: 1 * GRID_DENSITY_MIGRATION_V1,
                                    left: 4 * GRID_DENSITY_MIGRATION_V1,
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

            const disallowedWidgets = [
              "TABLE_WIDGET",
              "LIST_WIDGET",
              "TABS_WIDGET",
              "FORM_WIDGET",
              "CONTAINER_WIDGET",
            ];

            if (indexOf(disallowedWidgets, widget.type) > -1) {
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
