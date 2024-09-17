import type { PrivateWidgets } from "ee/entities/DataTree/types";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
  PropertyUpdates,
  SnipingModeProperty,
  WidgetCallout,
} from "WidgetProvider/constants";
import {
  BlueprintOperationTypes,
  type DSLWidget,
  type FlattenedWidgetProps,
} from "WidgetProvider/constants";
import WidgetFactory from "WidgetProvider/factory";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import {
  GridDefaults,
  RenderModes,
  WIDGET_TAGS,
} from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import equal from "fast-deep-equal/es6";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import {
  Positioning,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import {
  cloneDeep,
  compact,
  get,
  indexOf,
  isBoolean,
  isEmpty,
  isNumber,
  isString,
  omit,
  range,
  set,
  toString,
  xor,
} from "lodash";
import log from "loglevel";
import memoizeOne from "memoize-one";
import { buildDeprecationWidgetMessage } from "pages/Editor/utils";
import React from "react";
import shallowEqual from "shallowequal";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import type { ExtraDef } from "utils/autocomplete/defCreatorUtils";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";
import { klonaLiteWithTelemetry, removeFalsyEntries } from "utils/helpers";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import ListComponent, {
  ListComponentEmpty,
  ListComponentLoading,
} from "../component";
import ListPagination, {
  ServerSideListPagination,
} from "../component/ListPagination";
import IconSVG from "../icon.svg";
import derivedProperties from "./parseDerivedProperties";
import {
  PropertyPaneContentConfig,
  PropertyPaneStyleConfig,
} from "./propertyConfig";

const LIST_WIDGET_PAGINATION_HEIGHT = 36;

/* in the List Widget, "children.0.children.0.children.0.children" is the path to the list of all
  widgets present in the List Widget
*/
const PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET =
  "children.0.children.0.children.0.children";
class ListWidget extends BaseWidget<ListWidgetProps<WidgetProps>, WidgetState> {
  state = {
    page: 1,
  };

  static type = "LIST_WIDGET";

  static getConfig() {
    return {
      name: "List",
      iconSVG: IconSVG,
      needsMeta: true,
      isCanvas: true,
      isDeprecated: true,
      hideCard: true,
      replacement: "LIST_WIDGET_V2",
      needsHeightForContent: true,
      tags: [WIDGET_TAGS.DISPLAY],
    };
  }

  static getDefaults() {
    return {
      backgroundColor: "transparent",
      itemBackgroundColor: "#FFFFFF",
      rows: 40,
      columns: 24,
      animateLoading: true,
      gridType: "vertical",
      template: {},
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
      positioning: Positioning.Fixed,
      enhancements: {
        child: {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          autocomplete: (parentProps: any) => {
            return parentProps.childAutoComplete;
          },
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          updateDataTreePath: (parentProps: any, dataTreePath: string) => {
            return `${parentProps.widgetName}.template.${dataTreePath}`;
          },
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          shouldHideProperty: (parentProps: any, propertyName: string) => {
            if (propertyName === "dynamicHeight") return true;

            return false;
          },
          propertyUpdateHook: (
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parentProps: any,
            widgetName: string,
            propertyPath: string,
            propertyValue: string,
            isTriggerProperty: boolean,
          ) => {
            let value = propertyValue;

            if (!parentProps.widgetId) return [];

            const { jsSnippets, stringSegments } =
              getDynamicBindings(propertyValue);

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
                      positioning: Positioning.Fixed,
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
                                      dynamicHeight: "FIXED",
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
                                      dynamicHeight: "FIXED",
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
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const logBlackListMap: any = {};
              const container = get(
                widgets,
                `${get(widget, "children.0.children.0")}`,
              );
              const canvas = get(widgets, `${get(container, "children.0")}`);
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let updatePropertyMap: any = [];
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                      const { jsSnippets, stringSegments } =
                        getDynamicBindings(value);

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
                {
                  widgetId: container.widgetId,
                  propertyName: "dynamicHeight",
                  propertyValue: "FIXED",
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

              widget.dynamicHeight = "FIXED";

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
                "DIVIDER_WIDGET",
                "ICON_BUTTON_WIDGET",
                "IFRAME_WIDGET",
                "IMAGE_WIDGET",
                "INPUT_WIDGET_V2",
                "MAP_CHART_WIDGET",
                "MAP_WIDGET",
                "MENU_BUTTON_WIDGET",
                "PROGRESS_WIDGET",
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
    };
  }

  static getMethods() {
    return {
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        return [
          {
            propertyPath: "listData",
            propertyValue: propValueMap.data,
            isDynamicPropertyPath: true,
          },
        ];
      },
      getEditorCallouts(): WidgetCallout[] {
        return [
          {
            message: buildDeprecationWidgetMessage(ListWidget.getConfig().name),
          },
        ];
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "280px",
              minHeight: "300px",
            };
          },
        },
      ],
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "300px" },
        minWidth: { base: "280px" },
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return (
      widget: ListWidgetProps<WidgetProps>,
      extraDefsToDefine?: ExtraDef,
    ) => ({
      "!doc":
        "Containers are used to group widgets together to form logical higher order widgets. Containers let you organize your page better and move all the widgets inside them together.",
      "!url": "https://docs.appsmith.com/widget-reference/list",
      backgroundColor: {
        "!type": "string",
        "!url": "https://docs.appsmith.com/widget-reference/how-to-use-widgets",
      },
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      gridGap: "number",
      selectedItem: generateTypeDef(widget.selectedItem, extraDefsToDefine),
      items: generateTypeDef(widget.items, extraDefsToDefine),
      listData: generateTypeDef(widget.listData, extraDefsToDefine),
      pageNo: generateTypeDef(widget.pageNo),
      pageSize: generateTypeDef(widget.pageSize),
    });
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return PropertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return PropertyPaneStyleConfig;
  }

  static getDerivedPropertiesMap() {
    return {
      pageSize: `{{(()=>{${derivedProperties.getPageSize}})()}}`,
      selectedItem: `{{(()=>{${derivedProperties.getSelectedItem}})()}}`,
      items: `{{(() => {${derivedProperties.getItems}})()}}`,
      childAutoComplete: `{{(() => {${derivedProperties.getChildAutoComplete}})()}}`,
    };
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }

  componentDidMount() {
    if (this.props.serverSidePaginationEnabled && !this.props.pageNo) {
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }
    this.props.updateWidgetMetaProperty(
      "templateBottomRow",
      get(this.props.childWidgets, "0.children.0.bottomRow"),
    );

    // generate childMetaPropertyMap
    this.generateChildrenDefaultPropertiesMap(this.props);
    this.generateChildrenMetaPropertiesMap(this.props);
    this.generateChildrenEntityDefinitions(this.props);

    // add privateWidgets to ListWidget
    this.addPrivateWidgetsForChildren(this.props);
  }

  /**
   * generates the children entity definitions for children
   *
   * by entity definition we mean properties that will be open for users for autocomplete
   *
   * @param props
   */
  generateChildrenEntityDefinitions(props: ListWidgetProps<WidgetProps>) {
    const template = props.template;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childrenEntityDefinitions: Record<string, any> = {};

    if (template) {
      Object.keys(template).map((key: string) => {
        const currentTemplate = template[key];
        const widgetType = currentTemplate?.type;

        if (widgetType) {
          childrenEntityDefinitions[widgetType] = Object.keys(
            omit(
              WidgetFactory.getAutocompleteDefinitions(widgetType) as Record<
                string,
                unknown
              >,
              ["!doc", "!url"],
            ),
          );
        }
      });
    }

    if (this.props.updateWidgetMetaProperty) {
      this.props.updateWidgetMetaProperty(
        "childrenEntityDefinitions",
        childrenEntityDefinitions,
      );
    }
  }

  // updates the "privateWidgets" field of the List Widget
  addPrivateWidgetsForChildren(props: ListWidgetProps<WidgetProps>) {
    const privateWidgets: PrivateWidgets = {};
    const listWidgetChildren: WidgetProps[] = get(
      props,
      PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET,
    );
    if (!listWidgetChildren) return;
    listWidgetChildren.map((child) => {
      privateWidgets[child.widgetName] = true;
    });

    super.updateWidgetProperty("privateWidgets", privateWidgets);
  }

  generateChildrenDefaultPropertiesMap = (
    props: ListWidgetProps<WidgetProps>,
  ) => {
    const template = props.template;
    let childrenDefaultPropertiesMap = {};

    if (template) {
      Object.keys(template).map((key: string) => {
        const currentTemplate = template[key];
        const defaultProperties = WidgetFactory.getWidgetDefaultPropertiesMap(
          currentTemplate?.type,
        );

        Object.keys(defaultProperties).map((defaultPropertyKey: string) => {
          childrenDefaultPropertiesMap = {
            ...childrenDefaultPropertiesMap,
            [`${key}.${defaultPropertyKey}`]:
              defaultProperties[defaultPropertyKey],
          };
        });
      });
    }

    if (this.props.updateWidgetMetaProperty) {
      this.props.updateWidgetMetaProperty(
        "childrenDefaultPropertiesMap",
        childrenDefaultPropertiesMap,
      );
    }
  };

  generateChildrenMetaPropertiesMap = (props: ListWidgetProps<WidgetProps>) => {
    const template = props.template;
    let childrenMetaPropertiesMap = {};

    if (template) {
      Object.keys(template).map((key: string) => {
        const currentTemplate = template[key];
        const metaProperties = WidgetFactory.getWidgetMetaPropertiesMap(
          currentTemplate?.type,
        );

        Object.keys(metaProperties).map((metaPropertyKey: string) => {
          childrenMetaPropertiesMap = {
            ...childrenMetaPropertiesMap,
            [`${key}.${metaPropertyKey}`]: currentTemplate[metaPropertyKey],
          };
        });
      });
    }

    if (this.props.updateWidgetMetaProperty) {
      this.props.updateWidgetMetaProperty(
        "childrenMetaPropertiesMap",
        Object.keys(childrenMetaPropertiesMap),
      );
    }
  };

  componentDidUpdate(prevProps: ListWidgetProps<WidgetProps>) {
    const currentListWidgetChildren: WidgetProps[] = get(
      this.props,
      PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET,
    );

    const previousListWidgetChildren: WidgetProps[] = get(
      prevProps,
      PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET,
    );

    if (
      xor(
        Object.keys(get(prevProps, "template", {})),
        Object.keys(get(this.props, "template", {})),
      ).length > 0
    ) {
      this.generateChildrenDefaultPropertiesMap(this.props);
      this.generateChildrenMetaPropertiesMap(this.props);
      this.generateChildrenEntityDefinitions(this.props);
    }

    if (this.props.serverSidePaginationEnabled) {
      if (!this.props.pageNo) this.props.updateWidgetMetaProperty("pageNo", 1);
      // run onPageSizeChange if user resize widgets
      if (
        this.props.onPageSizeChange &&
        this.props.pageSize !== prevProps.pageSize
      ) {
        super.executeAction({
          triggerPropertyName: "onPageSizeChange",
          dynamicString: this.props.onPageSizeChange,
          event: {
            type: EventType.ON_PAGE_SIZE_CHANGE,
          },
        });
      }
    }

    if (this.props.serverSidePaginationEnabled) {
      if (
        this.props.serverSidePaginationEnabled === true &&
        prevProps.serverSidePaginationEnabled === false
      ) {
        super.executeAction({
          triggerPropertyName: "onPageSizeChange",
          dynamicString: this.props.onPageSizeChange,
          event: {
            type: EventType.ON_PAGE_SIZE_CHANGE,
          },
        });
      }
    }

    if (
      get(this.props.childWidgets, "0.children.0.bottomRow") !==
      get(prevProps.childWidgets, "0.children.0.bottomRow")
    ) {
      this.props.updateWidgetMetaProperty(
        "templateBottomRow",
        get(this.props.childWidgets, "0.children.0.bottomRow"),
        {
          triggerPropertyName: "onPageSizeChange",
          dynamicString: this.props.onPageSizeChange,
          event: {
            type: EventType.ON_PAGE_SIZE_CHANGE,
          },
        },
      );
    }

    // Update privateWidget field if there is a change in the List widget children
    if (!equal(currentListWidgetChildren, previousListWidgetChildren)) {
      this.addPrivateWidgetsForChildren(this.props);
    }
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      pageNo: 1,
      templateBottomRow: 16,
    };
  }

  onPageChange = (page: number) => {
    const currentPage = this.props.pageNo;
    const eventType =
      currentPage > page ? EventType.ON_PREV_PAGE : EventType.ON_NEXT_PAGE;
    this.props.updateWidgetMetaProperty("pageNo", page, {
      triggerPropertyName: "onPageChange",
      dynamicString: this.props.onPageChange,
      event: {
        type: eventType,
      },
    });
  };

  /**
   * on click item action
   *
   * @param rowIndex
   * @param action
   * @param onComplete
   */
  onItemClick = (rowIndex: number, action: string | undefined) => {
    // setting selectedItemIndex on click of container
    const selectedItemIndex = isNumber(this.props.selectedItemIndex)
      ? this.props.selectedItemIndex
      : -1;

    if (selectedItemIndex !== rowIndex) {
      this.props.updateWidgetMetaProperty("selectedItemIndex", rowIndex, {
        dynamicString: this.props.onRowSelected,
        event: {
          type: EventType.ON_ROW_SELECTED,
        },
      });
    }

    if (!action) return;

    try {
      const rowData = this.props.listData?.[rowIndex];
      const { jsSnippets } = getDynamicBindings(action);
      const modifiedAction = jsSnippets.reduce((prev: string, next: string) => {
        return prev + `{{${next}}} `;
      }, "");

      super.executeAction({
        dynamicString: modifiedAction,
        event: {
          type: EventType.ON_CLICK,
        },
        globalContext: { currentItem: rowData },
      });
    } catch (error) {
      log.debug("Error parsing row action", error);
    }
  };

  renderChild = (childWidgetData: WidgetProps) => {
    const { shouldPaginate } = this.shouldPaginate();
    const { componentHeight, componentWidth } = this.props;

    childWidgetData.parentId = this.props.widgetId;
    // childWidgetData.shouldScrollContents = this.props.shouldScrollContents;
    childWidgetData.canExtend = undefined;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.minHeight = componentHeight;
    childWidgetData.rightColumn = componentWidth;
    childWidgetData.noPad = true;
    childWidgetData.bottomRow = shouldPaginate
      ? componentHeight - LIST_WIDGET_PAGINATION_HEIGHT
      : componentHeight;
    const positioning: Positioning =
      this.props.positioning || childWidgetData.positioning;
    childWidgetData.positioning = positioning;
    childWidgetData.useAutoLayout = positioning === Positioning.Vertical;
    return renderAppsmithCanvas(childWidgetData as WidgetProps);
  };

  getGridGap = () =>
    this.props.gridGap && this.props.gridGap >= -8 ? this.props.gridGap : 0;

  /**
   * here we are updating the position of each items and disabled resizing for
   * all items except template ( first item )
   *
   * @param children
   */
  updatePosition = (children: DSLWidget[]): DSLWidget[] => {
    return children.map((child: DSLWidget, index) => {
      const gap = this.getGridGap();

      return {
        ...child,
        gap,
        backgroundColor: this.props.itemBackgroundColor,
        borderRadius: this.props.borderRadius,
        boxShadow: this.props.boxShadow,
        boxShadowColor: this.props.boxShadowColor,
        topRow:
          index * children[0].bottomRow +
          index * (gap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT),
        bottomRow:
          (index + 1) * children[0].bottomRow +
          index * (gap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT),
        resizeDisabled:
          index > 0 && this.props.renderMode === RenderModes.CANVAS,
      };
    });
  };

  updateTemplateWidgetProperties = (widget: WidgetProps, itemIndex: number) => {
    const { dynamicBindingPathList, dynamicTriggerPathList, template } =
      this.props;
    const { widgetName = "" } = widget;
    // Update properties if they're dynamic
    // `template` property should have an array of values
    // if it is a dynamicbinding

    if (
      Array.isArray(dynamicBindingPathList) &&
      dynamicBindingPathList.length > 0
    ) {
      // Get all paths in the dynamicBindingPathList sans the List Widget name prefix
      const dynamicPaths: string[] = compact(
        dynamicBindingPathList.map((path: Record<"key", string>) =>
          path.key.replace(`template.${widgetName}.`, ""),
        ),
      );

      // Update properties in the widget based on the paths
      // By picking the correct value from the evaluated values in the template
      dynamicPaths.forEach((path: string) => {
        const evaluatedProperty = get(template, `${widgetName}.${path}`);

        if (
          Array.isArray(evaluatedProperty) &&
          evaluatedProperty.length > itemIndex
        ) {
          const evaluatedValue = evaluatedProperty[itemIndex];
          const validationPath = get(widget, `validationPaths`)[path];

          /**
           * Following conditions are special cases written to support
           * Dynamic Menu Items (Menu button Widget) inside the List Widget.
           *
           * This is an interim fix since List Widget V2 is just around the corner.
           *
           * Here we are simply setting the evaluated value as it is without tampering it.
           * This is crucial for dynamic menu items to operate in the menu button widget
           *
           * The menu button widget decides if the value entered in the property pane is
           * to be converted and interpreted to as an Array or a Type (boolean and text
           * being the most used ones). This is done because if someone has used the
           * {{currentItem}} binding to configure the menu item inside the widget, then the
           * widget will need an array of evaluated values for the respective menu items.
           * However, if the {{currentItem}} binding is not used, then we only need one
           * single value for all menu items.
           *
           * Dynamic Menu Items (Menu button Widget) -
           * https://github.com/appsmithorg/appsmith/pull/17652
           */
          if (
            (path.includes("configureMenuItems.config") &&
              validationPath?.type === ValidationTypes.ARRAY_OF_TYPE_OR_TYPE) ||
            (path === "sourceData" &&
              validationPath?.type === ValidationTypes.FUNCTION)
          ) {
            set(widget, path, evaluatedValue);

            return;
          }

          if (
            (validationPath?.type === ValidationTypes.BOOLEAN &&
              isBoolean(evaluatedValue)) ||
            validationPath?.type === ValidationTypes.OBJECT
          ) {
            set(widget, path, evaluatedValue);
            set(widget, `validationMessages.${path}`, "");
            set(widget, `invalidProps.${path}`, "");
          } else if (
            validationPath?.type === ValidationTypes.ARRAY ||
            validationPath?.type === ValidationTypes.OBJECT_ARRAY
          ) {
            const value = Array.isArray(evaluatedValue) ? evaluatedValue : [];
            set(widget, path, value);
          } else {
            set(widget, path, toString(evaluatedValue));
          }
        }
      });
    }

    // add default value
    Object.keys(get(widget, "defaultProps", {})).map((key: string) => {
      const defaultPropertyValue = get(widget, `${widget.defaultProps[key]}`);

      set(widget, `${key}`, defaultPropertyValue);
    });

    get(widget, "defaultMetaProps", []).map((key: string) => {
      const metaPropertyValue = get(
        this.props.childMetaProperties,
        `${widget.widgetName}.${key}.${itemIndex}`,
        undefined,
      );

      if (
        typeof metaPropertyValue !== "undefined" &&
        metaPropertyValue !== null
      ) {
        set(widget, key, metaPropertyValue);
      }
    });

    if (
      Array.isArray(dynamicTriggerPathList) &&
      dynamicTriggerPathList.length > 0
    ) {
      // Get all paths in the dynamicBindingPathList sans the List Widget name prefix
      const triggerPaths: string[] = compact(
        dynamicTriggerPathList.map((path: Record<"key", string>) =>
          path.key.includes(`template.${widgetName}`)
            ? path.key.replace(`template.${widgetName}.`, "")
            : undefined,
        ),
      );

      triggerPaths.forEach((path: string) => {
        const propertyValue = get(
          this.props.template[widget.widgetName],
          path,
          "",
        );

        if (
          propertyValue.indexOf("currentItem") > -1 &&
          propertyValue.indexOf("{{((currentItem) => {") === -1
        ) {
          const { jsSnippets } = getDynamicBindings(propertyValue);
          const listItem = this.props.listData?.[itemIndex] || {};
          const stringifiedListItem = JSON.stringify(listItem);
          const newPropertyValue = jsSnippets.reduce(
            (prev: string, next: string) => {
              if (next.indexOf("currentItem") > -1) {
                return (
                  prev +
                  `{{((currentItem) => { ${next}})(JSON.parse(JSON.stringify(${stringifiedListItem})))}}`
                );
              }
              return prev + `{{${next}}}`;
            },
            "",
          );
          set(widget, path, newPropertyValue);
        }

        if (
          propertyValue.indexOf("currentIndex") > -1 &&
          propertyValue.indexOf("{{((currentIndex) => {") === -1
        ) {
          const { jsSnippets } = getDynamicBindings(propertyValue);

          const newPropertyValue = jsSnippets.reduce(
            (prev: string, next: string) => {
              if (
                next.indexOf("currentItem") > -1 ||
                next.indexOf("currentIndex") > -1
              ) {
                return (
                  prev +
                  `{{((currentIndex) => { ${next}})(JSON.parse(JSON.stringify(${itemIndex})))}}`
                );
              }
              return prev + `{{${next}}}`;
            },
            "",
          );

          set(widget, path, newPropertyValue);
        }
      });
    }

    return this.updateNonTemplateWidgetProperties(widget, itemIndex);
  };

  updateNonTemplateWidgetProperties = (
    widget: WidgetProps,
    itemIndex: number,
  ) => {
    const { page } = this.state;
    const { perPage } = this.shouldPaginate();
    const originalIndex = ((page - 1) * perPage - itemIndex) * -1;

    if (originalIndex !== 0) {
      set(
        widget,
        `widgetId`,
        `list-widget-child-id-${itemIndex}-${widget.widgetName}`,
      );

      set(widget, `isAutoGeneratedWidget`, true);

      if (this.props.renderMode === RenderModes.CANVAS) {
        set(widget, `resizeDisabled`, true);
        set(widget, `disablePropertyPane`, true);
        set(widget, `dragDisabled`, true);
        set(widget, `dropDisabled`, true);
      }
    }

    set(widget, `__metaOptions`, {
      widgetName: this.props.widgetName,
      widgetId: this.props.widgetId,
      metaPropPrefix: `childMetaProperties`,
      index: itemIndex,
    });

    return widget;
  };

  /**
   * @param children
   */
  useNewValues = (children: DSLWidget[]) => {
    const updatedChildren = children.map(
      (listItemContainer: DSLWidget, listItemIndex: number) => {
        let updatedListItemContainer = listItemContainer;
        // Get an array of children in the current list item
        const listItemChildren = get(
          updatedListItemContainer,
          "children[0].children",
          [],
        );

        // If children exist
        if (listItemChildren.length > 0) {
          // Update the properties of all the children
          const updatedListItemChildren = listItemChildren.map(
            (templateWidget: WidgetProps) => {
              // This will return the updated child widget
              return this.updateTemplateWidgetProperties(
                templateWidget,
                listItemIndex,
              );
            },
          );
          // Set the update list of children as the new children for the current list item
          set(
            updatedListItemContainer,
            "children[0].children",
            updatedListItemChildren,
          );
        }
        // Get the item container's canvas child widget
        const listItemContainerCanvas = get(
          updatedListItemContainer,
          "children[0]",
        );
        // Set properties of the container's canvas child widget
        const updatedListItemContainerCanvas =
          this.updateNonTemplateWidgetProperties(
            listItemContainerCanvas,
            listItemIndex,
          );
        // Set the item container's canvas child widget
        set(
          updatedListItemContainer,
          "children[0]",
          updatedListItemContainerCanvas,
        );
        // Set properties of the item container
        updatedListItemContainer = this.updateNonTemplateWidgetProperties(
          listItemContainer,
          listItemIndex,
        );

        set(updatedListItemContainer, `disabledResizeHandles`, [
          "left",
          "top",
          "right",
          "bottomRight",
          "topLeft",
          "topRight",
          "bottomLeft",
        ]);

        set(updatedListItemContainer, "ignoreCollision", true);
        set(updatedListItemContainer, "shouldScrollContents", undefined);

        return updatedListItemContainer;
      },
    );

    return updatedChildren;
  };

  /**
   * We add a flag here to not fetch the widgets from the canvasWidgets
   * in the metaHOC base on the widget id. Rather use the props as is.
   */
  addFlags = (children: DSLWidget[]) => {
    return (children || []).map((childWidget) => {
      childWidget.skipWidgetPropsHydration = true;

      childWidget.children = this.addFlags(childWidget?.children || []);

      return childWidget;
    });
  };

  updateGridChildrenProps = (children: DSLWidget[]) => {
    let updatedChildren = this.useNewValues(children);
    updatedChildren = this.updateActions(updatedChildren);
    updatedChildren = this.paginateItems(updatedChildren);
    updatedChildren = this.updatePosition(updatedChildren);
    updatedChildren = this.addFlags(updatedChildren);

    return updatedChildren;
  };

  updateActions = (children: DSLWidget[]) => {
    return children.map((child: DSLWidget, index) => {
      return {
        ...child,
        onClickCapture: () =>
          this.onItemClick(index, this.props.onListItemClick),
        selected: this.props.selectedItemIndex === index,
        focused: index === 0 && this.props.renderMode === RenderModes.CANVAS,
      };
    });
  };

  /**
   * paginate items
   *
   * @param children
   */
  paginateItems = (children: DSLWidget[]) => {
    // return all children if serverside pagination
    if (this.props.serverSidePaginationEnabled) return children;
    const { page } = this.state;
    const { perPage, shouldPaginate } = this.shouldPaginate();

    if (shouldPaginate) {
      return children.slice((page - 1) * perPage, page * perPage);
    }

    return children;
  };

  /**
   * renders children
   */
  renderChildren = () => {
    if (
      this.props.childWidgets &&
      this.props.childWidgets.length > 0 &&
      this.props.listData
    ) {
      const { page } = this.state;
      const children = removeFalsyEntries(
        klonaLiteWithTelemetry(
          this.props.childWidgets,
          "ListWidget.renderChildren",
        ),
      );
      const childCanvas = children[0];
      const { perPage } = this.shouldPaginate();

      const canvasChildren = childCanvas.children;
      const template = canvasChildren.slice(0, 1).shift();
      const gridGap = this.getGridGap();
      try {
        // Passing template instead of deriving from canvasChildren becuase lesser items to compare
        // in memoize
        childCanvas.children = this.getCanvasChildren(
          template,
          this.props.listData,
          this.props.template,
          canvasChildren,
          page,
          gridGap,
          this.props.itemBackgroundColor,
          perPage,
        );
      } catch (e) {
        log.error(e);
      }
      return this.renderChild(childCanvas);
    }
  };

  getCanvasChildren = memoizeOne(
    (
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      template: any,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listData: any,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      staticTemplate: any,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvasChildren: any,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      page: number,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      gridGap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      itemBackgroundColor,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      perPage,
    ) => {
      const canvasChildrenList = [];
      if (listData.length > 0) {
        for (let i = 0; i < listData.length; i++) {
          canvasChildrenList[i] = klonaLiteWithTelemetry(
            template,
            "ListWidget.renderChildren",
          );
        }
        canvasChildren = this.updateGridChildrenProps(canvasChildrenList);
      } else {
        canvasChildren = this.updateGridChildrenProps(canvasChildren);
      }

      return canvasChildren;
    },
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prev: any, next: any) => this.compareProps(prev, next),
  );

  // DeepEqual Comparison
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compareProps = (prev: any[], next: any[]) => {
    return (
      equal(prev[0], next[0]) &&
      shallowEqual(prev[1], next[1]) &&
      equal(prev[2], next[2]) &&
      equal(prev[3], next[3]) &&
      prev[4] === next[4] &&
      prev[5] === next[5] &&
      prev[6] === next[6] &&
      prev[7] === next[7]
    );
  };

  /**
   * 400
   * 200
   * can data be paginated
   */
  shouldPaginate = () => {
    const { listData, pageSize, serverSidePaginationEnabled } = this.props;

    if (serverSidePaginationEnabled) {
      return { shouldPaginate: true, perPage: pageSize };
    }

    if (!listData?.length) {
      return { shouldPaginate: false, perPage: 0 };
    }

    const shouldPaginate = pageSize < listData.length;

    return { shouldPaginate, perPage: pageSize };
  };

  /**
   * view that is rendered in editor
   */
  getWidgetView() {
    const children = this.renderChildren();
    const { componentHeight } = this.props;
    const { pageNo, serverSidePaginationEnabled } = this.props;
    const { perPage, shouldPaginate } = this.shouldPaginate();
    const templateBottomRow = get(
      this.props.childWidgets,
      "0.children.0.bottomRow",
    ) as unknown as number;
    const templateHeight =
      templateBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    if (this.props.isLoading) {
      return (
        <ListComponentLoading className="">
          {range(10).map((i) => (
            <div className="bp3-card bp3-skeleton" key={`skeleton-${i}`}>
              <h5 className="bp3-heading">
                <a className=".modifier" href="#">
                  Card heading
                </a>
              </h5>
              <p className=".modifier">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque
                eget tortor felis. Fusce dapibus metus in dapibus mollis.
                Quisque eget ex diam.
              </p>
              <button
                className="bp3-button bp3-icon-add .modifier"
                type="button"
              >
                Submit
              </button>
            </div>
          ))}
        </ListComponentLoading>
      );
    }

    if (
      Array.isArray(this.props.listData) &&
      this.props.listData.filter((item) => !isEmpty(item)).length === 0 &&
      this.props.renderMode === RenderModes.PAGE
    ) {
      return <ListComponentEmpty>No data to display</ListComponentEmpty>;
    }

    if (isNaN(templateHeight) || templateHeight > componentHeight - 45) {
      return (
        <ListComponentEmpty>
          Please make sure the list widget height is greater than the template
          container height.
        </ListComponentEmpty>
      );
    }

    return (
      <ListComponent
        {...this.props}
        backgroundColor={this.props.backgroundColor}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        hasPagination={shouldPaginate}
        key={`list-widget-page-${this.state.page}`}
        listData={this.props.listData || []}
      >
        {children}

        {shouldPaginate &&
          (serverSidePaginationEnabled ? (
            <ServerSideListPagination
              accentColor={this.props.accentColor}
              borderRadius={this.props.borderRadius}
              boxShadow={this.props.boxShadow}
              disabled={false && this.props.renderMode === RenderModes.CANVAS}
              nextPageClick={() => this.onPageChange(pageNo + 1)}
              pageNo={this.props.pageNo}
              prevPageClick={() => this.onPageChange(pageNo - 1)}
            />
          ) : (
            <ListPagination
              accentColor={this.props.accentColor}
              borderRadius={this.props.borderRadius}
              boxShadow={this.props.boxShadow}
              current={this.state.page}
              disabled={false && this.props.renderMode === RenderModes.CANVAS}
              onChange={(page: number) => this.setState({ page })}
              perPage={perPage}
              total={(this.props.listData || []).length}
            />
          ))}
      </ListComponent>
    );
  }
}

export interface ListWidgetProps<T extends WidgetProps> extends WidgetProps {
  children?: T[];
  shouldScrollContents?: boolean;
  onListItemClick?: string;
  listData?: Array<Record<string, unknown>>;
  currentItemStructure?: Record<string, string>;
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
  accentColor: string;
}

export default ListWidget;
