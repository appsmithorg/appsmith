import { WidgetConfigReducerState } from "reducers/entityReducers/widgetConfigReducer";
import { WidgetProps } from "widgets/BaseWidget";
import moment from "moment-timezone";
import { cloneDeep, get, indexOf, isString } from "lodash";
import { generateReactKey } from "utils/generators";
import { WidgetTypes } from "constants/WidgetConstants";
import { BlueprintOperationTypes } from "sagas/WidgetBlueprintSagasEnums";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { Colors } from "constants/Colors";
import FileDataTypes from "widgets/FileDataTypes";

/**
 * this config sets the default values of properties being used in the widget
 */
const WidgetConfigResponse: WidgetConfigReducerState = {
  config: {
    BUTTON_WIDGET: {
      text: "Submit",
      buttonStyle: "PRIMARY_BUTTON",
      rows: 1,
      columns: 2,
      widgetName: "Button",
      isDisabled: false,
      isVisible: true,
      isDefaultClickDisabled: true,
      version: 1,
    },
    TEXT_WIDGET: {
      text: "Label",
      fontSize: "PARAGRAPH",
      fontStyle: "BOLD",
      textAlign: "LEFT",
      textColor: Colors.THUNDER,
      rows: 1,
      columns: 4,
      widgetName: "Text",
      version: 1,
    },
    RICH_TEXT_EDITOR_WIDGET: {
      defaultText: "This is the initial <b>content</b> of the editor",
      rows: 5,
      columns: 8,
      isDisabled: false,
      isVisible: true,
      widgetName: "RichTextEditor",
      isDefaultClickDisabled: true,
      inputType: "html",
      version: 1,
    },
    IMAGE_WIDGET: {
      defaultImage:
        "https://res.cloudinary.com/drako999/image/upload/v1589196259/default.png",
      imageShape: "RECTANGLE",
      maxZoomLevel: 1,
      image: "",
      rows: 3,
      columns: 4,
      widgetName: "Image",
      version: 1,
    },
    INPUT_WIDGET: {
      inputType: "TEXT",
      rows: 1,
      label: "",
      columns: 5,
      widgetName: "Input",
      version: 1,
      resetOnSubmit: true,
      isRequired: false,
      isDisabled: false,
    },
    SWITCH_WIDGET: {
      label: "Label",
      rows: 1,
      columns: 2,
      defaultSwitchState: true,
      widgetName: "Switch",
      alignWidget: "LEFT",
      version: 1,
      isDisabled: false,
    },
    ICON_WIDGET: {
      widgetName: "Icon",
      rows: 1,
      columns: 1,
      version: 1,
    },
    CONTAINER_WIDGET: {
      backgroundColor: "#FFFFFF",
      rows: 10,
      columns: 8,
      widgetName: "Container",
      containerStyle: "card",
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
            },
          },
        ],
      },
      version: 1,
    },
    DATE_PICKER_WIDGET: {
      isDisabled: false,
      datePickerType: "DATE_PICKER",
      rows: 1,
      label: "",
      dateFormat: "DD/MM/YYYY HH:mm",
      columns: 5,
      widgetName: "DatePicker",
      defaultDate: moment().format("DD/MM/YYYY HH:mm"),
      version: 1,
    },
    DATE_PICKER_WIDGET2: {
      isDisabled: false,
      datePickerType: "DATE_PICKER",
      rows: 1,
      label: "",
      dateFormat: "DD/MM/YYYY HH:mm",
      columns: 5,
      widgetName: "DatePicker",
      defaultDate: moment().toISOString(),
      version: 2,
      isRequired: false,
    },
    VIDEO_WIDGET: {
      rows: 7,
      columns: 7,
      widgetName: "Video",
      url: "https://www.youtube.com/watch?v=mzqK0QIZRLs",
      autoPlay: false,
      version: 1,
    },
    TABLE_WIDGET: {
      rows: 7,
      columns: 8,
      label: "Data",
      widgetName: "Table",
      searchKey: "",
      textSize: "PARAGRAPH",
      horizontalAlignment: "LEFT",
      verticalAlignment: "CENTER",
      primaryColumns: {
        action: {
          id: "1",
          label: "Action",
          columnType: "button",
          isVisible: true,
          isDerived: true,
          index: 3,
          buttonLabel: "Start",
          width: 50,
          computedValue: "Do It",
          onClick:
            "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/connecting-to-databases/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
        },
      },
      derivedColumns: {},
      tableData: [
        {
          step: "#1",
          task: "Drag a Table",
          status: "✅",
          action: "",
        },
        {
          step: "#2",
          task: "Create a Query fetch_users with the Mock DB",
          status: "--",
          action: "",
        },
        {
          step: "#3",
          task: "Bind the query to the table {{fetch_users.data}}",
          status: "--",
          action: "",
        },
      ],
      version: 1,
    },
    DROP_DOWN_WIDGET: {
      rows: 1,
      columns: 5,
      label: "",
      selectionType: "SINGLE_SELECT",
      options: [
        { label: "Vegetarian", value: "VEG" },
        { label: "Non-Vegetarian", value: "NON_VEG" },
        { label: "Vegan", value: "VEGAN" },
      ],
      widgetName: "Dropdown",
      defaultOptionValue: "VEG",
      version: 1,
      isRequired: false,
      isDisabled: false,
    },
    CHECKBOX_WIDGET: {
      rows: 1,
      columns: 3,
      label: "Label",
      defaultCheckedState: true,
      widgetName: "Checkbox",
      version: 1,
      alignWidget: "LEFT",
      isDisabled: false,
      isRequired: false,
    },
    RADIO_GROUP_WIDGET: {
      rows: 2,
      columns: 3,
      label: "",
      options: [
        { label: "Male", value: "M" },
        { label: "Female", value: "F" },
      ],
      defaultOptionValue: "M",
      widgetName: "RadioGroup",
      version: 1,
      isRequired: false,
      isDisabled: false,
    },
    FILE_PICKER_WIDGET: {
      rows: 1,
      files: [],
      label: "Select Files",
      columns: 4,
      maxNumFiles: 1,
      maxFileSize: 5,
      fileDataType: FileDataTypes.Base64,
      widgetName: "FilePicker",
      isDefaultClickDisabled: true,
      version: 1,
      isRequired: false,
      isDisabled: false,
    },
    TABS_WIDGET: {
      rows: 7,
      columns: 8,
      shouldScrollContents: false,
      widgetName: "Tabs",
      tabsObj: {
        tab1: {
          label: "Tab 1",
          id: "tab1",
          widgetId: "",
          isVisible: true,
          index: 0,
        },
        tab2: {
          label: "Tab 2",
          id: "tab2",
          widgetId: "",
          isVisible: true,
          index: 1,
        },
      },
      shouldShowTabs: true,
      defaultTab: "Tab 1",
      blueprint: {
        operations: [
          {
            type: BlueprintOperationTypes.MODIFY_PROPS,
            fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
              const tabs = Object.values({ ...widget.tabsObj });
              const tabsObj = tabs.reduce((obj: any, tab: any) => {
                const newTab = { ...tab };
                newTab.widgetId = generateReactKey();
                obj[newTab.id] = newTab;
                return obj;
              }, {});
              const updatePropertyMap = [
                {
                  widgetId: widget.widgetId,
                  propertyName: "tabsObj",
                  propertyValue: tabsObj,
                },
              ];
              return updatePropertyMap;
            },
          },
        ],
      },
      version: 2,
    },
    MODAL_WIDGET: {
      rows: 6,
      columns: 6,
      size: "MODAL_SMALL",
      canEscapeKeyClose: true,
      // detachFromLayout is set true for widgets that are not bound to the widgets within the layout.
      // setting it to true will only render the widgets(from sidebar) on the main container without any collision check.
      detachFromLayout: true,
      canOutsideClickClose: true,
      shouldScrollContents: true,
      widgetName: "Modal",
      children: [],
      version: 1,
      blueprint: {
        view: [
          {
            type: "CANVAS_WIDGET",
            position: { left: 0, top: 0 },
            props: {
              detachFromLayout: true,
              canExtend: true,
              isVisible: true,
              isDisabled: false,
              shouldScrollContents: false,
              children: [],
              version: 1,
              blueprint: {
                view: [
                  {
                    type: "ICON_WIDGET",
                    position: { left: 14, top: 0 },
                    size: { rows: 1, cols: 2 },
                    props: {
                      iconName: "cross",
                      iconSize: 24,
                      color: "#040627",
                      version: 1,
                    },
                  },
                  {
                    type: "TEXT_WIDGET",
                    position: { left: 0, top: 0 },
                    size: { rows: 1, cols: 10 },
                    props: {
                      text: "Modal Title",
                      textStyle: "HEADING",
                      version: 1,
                    },
                  },
                  {
                    type: "BUTTON_WIDGET",
                    position: { left: 9, top: 4 },
                    size: { rows: 1, cols: 3 },
                    props: {
                      text: "Cancel",
                      buttonStyle: "SECONDARY_BUTTON",
                      version: 1,
                    },
                  },
                  {
                    type: "BUTTON_WIDGET",
                    position: { left: 12, top: 4 },
                    size: { rows: 1, cols: 4 },
                    props: {
                      text: "Confirm",
                      buttonStyle: "PRIMARY_BUTTON",
                      version: 1,
                    },
                  },
                ],
                operations: [
                  {
                    type: BlueprintOperationTypes.MODIFY_PROPS,
                    fn: (
                      widget: WidgetProps & { children?: WidgetProps[] },
                      widgets: { [widgetId: string]: FlattenedWidgetProps },
                      parent?: WidgetProps & { children?: WidgetProps[] },
                    ) => {
                      const iconChild =
                        widget.children &&
                        widget.children.find(
                          (child) => child.type === "ICON_WIDGET",
                        );

                      if (iconChild && parent) {
                        return [
                          {
                            widgetId: iconChild.widgetId,
                            propertyName: "onClick",
                            propertyValue: `{{closeModal('${parent.widgetName}')}}`,
                          },
                        ];
                      }
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
    CANVAS_WIDGET: {
      rows: 0,
      columns: 0,
      widgetName: "Canvas",
      version: 1,
    },
    CHART_WIDGET: {
      rows: 8,
      columns: 6,
      widgetName: "Chart",
      chartType: "LINE_CHART",
      chartName: "Sales on working days",
      allowHorizontalScroll: false,
      version: 1,
      chartData: {
        [generateReactKey()]: {
          seriesName: "Sales",
          data: [
            {
              x: "Mon",
              y: 10000,
            },
            {
              x: "Tue",
              y: 12000,
            },
            {
              x: "Wed",
              y: 32000,
            },
            {
              x: "Thu",
              y: 28000,
            },
            {
              x: "Fri",
              y: 14000,
            },
            {
              x: "Sat",
              y: 19000,
            },
            {
              x: "Sun",
              y: 36000,
            },
          ],
        },
      },
      xAxisName: "Last Week",
      yAxisName: "Total Order Revenue $",
    },
    FORM_BUTTON_WIDGET: {
      rows: 1,
      columns: 3,
      widgetName: "FormButton",
      text: "Submit",
      isDefaultClickDisabled: true,
      version: 1,
    },
    FORM_WIDGET: {
      rows: 13,
      columns: 7,
      widgetName: "Form",
      backgroundColor: "white",
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
                    type: "TEXT_WIDGET",
                    size: { rows: 1, cols: 12 },
                    position: { top: 0, left: 0 },
                    props: {
                      text: "Form",
                      textStyle: "HEADING",
                      version: 1,
                    },
                  },
                  {
                    type: "FORM_BUTTON_WIDGET",
                    size: { rows: 1, cols: 4 },
                    position: { top: 11, left: 12 },
                    props: {
                      text: "Submit",
                      buttonStyle: "PRIMARY_BUTTON",
                      disabledWhenInvalid: true,
                      resetFormOnClick: true,
                      version: 1,
                    },
                  },
                  {
                    type: "FORM_BUTTON_WIDGET",
                    size: { rows: 1, cols: 4 },
                    position: { top: 11, left: 8 },
                    props: {
                      text: "Reset",
                      buttonStyle: "SECONDARY_BUTTON",
                      disabledWhenInvalid: false,
                      resetFormOnClick: true,
                      version: 1,
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
    MAP_WIDGET: {
      rows: 12,
      columns: 8,
      isDisabled: false,
      isVisible: true,
      widgetName: "Map",
      enableSearch: true,
      zoomLevel: 50,
      enablePickLocation: true,
      allowZoom: true,
      mapCenter: { lat: -34.397, long: 150.644 },
      defaultMarkers: [{ lat: -34.397, long: 150.644, title: "Test A" }],
      version: 1,
    },
    SKELETON_WIDGET: {
      isLoading: true,
      rows: 1,
      columns: 1,
      widgetName: "Skeleton",
      version: 1,
    },
    TABS_MIGRATOR_WIDGET: {
      isLoading: true,
      rows: 1,
      columns: 1,
      widgetName: "Skeleton",
      version: 1,
    },
    [WidgetTypes.LIST_WIDGET]: {
      backgroundColor: "",
      itemBackgroundColor: "white",
      rows: 10,
      columns: 8,
      gridType: "vertical",
      enhancements: {
        child: {
          autocomplete: (parentProps: any) => {
            return parentProps.childAutoComplete;
          },
          hideEvaluatedValue: () => true,
          propertyUpdateHook: (
            parentProps: any,
            widgetName: string,
            propertyPath: string, // onClick
            propertyValue: string,
            isTriggerProperty: boolean,
          ) => {
            let value = propertyValue;

            if (!parentProps.widgetId) return [];

            const { jsSnippets } = getDynamicBindings(propertyValue);

            const modifiedAction = jsSnippets.reduce(
              (prev: string, next: string) => {
                return `${prev}${next}`;
              },
              "",
            );

            value = `{{${parentProps.widgetName}.items.map((currentItem) => ${modifiedAction})}}`;
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
      items: [
        {
          id: 1,
          num: "001",
          name: "Bulbasaur",
          img: "http://www.serebii.net/pokemongo/pokemon/001.png",
        },
        {
          id: 2,
          num: "002",
          name: "Ivysaur",
          img: "http://www.serebii.net/pokemongo/pokemon/002.png",
        },
        {
          id: 3,
          num: "003",
          name: "Venusaur",
          img: "http://www.serebii.net/pokemongo/pokemon/003.png",
        },
        {
          id: 4,
          num: "004",
          name: "Charmander",
          img: "http://www.serebii.net/pokemongo/pokemon/004.png",
        },
        {
          id: 5,
          num: "005",
          name: "Charmeleon",
          img: "http://www.serebii.net/pokemongo/pokemon/005.png",
        },
        {
          id: 6,
          num: "006",
          name: "Charizard",
          img: "http://www.serebii.net/pokemongo/pokemon/006.png",
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
              noPad: true,
              children: [],
              blueprint: {
                view: [
                  {
                    type: "CONTAINER_WIDGET",
                    size: { rows: 4, cols: 16 },
                    position: { top: 0, left: 0 },
                    props: {
                      backgroundColor: "white",
                      containerStyle: "card",
                      dragDisabled: true,
                      isDeletable: false,
                      disallowCopy: true,
                      disablePropertyPane: true,
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
                                    size: { rows: 3, cols: 4 },
                                    position: { top: 0, left: 0 },
                                    props: {
                                      defaultImage:
                                        "https://res.cloudinary.com/drako999/image/upload/v1589196259/default.png",
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
                                    size: { rows: 1, cols: 6 },
                                    position: { top: 0, left: 4 },
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
                                    size: { rows: 1, cols: 6 },
                                    position: { top: 1, left: 4 },
                                    props: {
                                      text: "{{currentItem.num}}",
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
                  const keys = Object.keys(childWidget);

                  for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    let value = childWidget[key];

                    if (isString(value) && value.indexOf("currentItem") > -1) {
                      const { jsSnippets } = getDynamicBindings(value);

                      const modifiedAction = jsSnippets.reduce(
                        (prev: string, next: string) => {
                          return prev + `${next}`;
                        },
                        "",
                      );

                      value = `{{${widget.widgetName}.items.map((currentItem) => ${modifiedAction})}}`;

                      childWidget[key] = value;

                      dynamicBindingPathList.push({
                        key: `template.${childWidget.widgetName}.${key}`,
                      });
                    }
                  }

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
              return updatePropertyMap;
            },
          },
          {
            type: BlueprintOperationTypes.CHILD_OPERATIONS,
            fn: (
              widgets: { [widgetId: string]: FlattenedWidgetProps },
              widgetId: string,
              parentId: string,
              widgetPropertyMaps: {
                defaultPropertyMap: Record<string, string>;
              },
            ) => {
              if (!parentId) return { widgets };
              const widget = { ...widgets[widgetId] };
              const parent = { ...widgets[parentId] };

              const disallowedWidgets = [WidgetTypes.FILE_PICKER_WIDGET];

              if (
                Object.keys(widgetPropertyMaps.defaultPropertyMap).length > 0 ||
                indexOf(disallowedWidgets, widget.type) > -1
              ) {
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
                  message: `${
                    WidgetConfigResponse.config[widget.type].widgetName
                  } widgets cannot be used inside the list widget right now.`,
                };
              }

              const template = {
                ...get(parent, "template", {}),
                [widget.widgetName]: widget,
              };

              parent.template = template;

              widgets[parentId] = parent;

              return { widgets };
            },
          },
        ],
      },
    },
  },
  configVersion: 1,
};

export default WidgetConfigResponse;
