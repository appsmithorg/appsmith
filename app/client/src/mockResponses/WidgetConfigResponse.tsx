import { WidgetConfigReducerState } from "reducers/entityReducers/widgetConfigReducer";
import { WidgetProps } from "widgets/BaseWidget";
import moment from "moment-timezone";
import { generateReactKey } from "utils/generators";
import { FileDataTypes } from "widgets/FilepickerWidget";

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
      textStyle: "LABEL",
      textAlign: "LEFT",
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
    },
    SWITCH_WIDGET: {
      label: "Label",
      rows: 1,
      columns: 2,
      defaultSwitchState: true,
      widgetName: "Switch",
      alignWidget: "LEFT",
      version: 1,
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
      primaryColumns: {},
      derivedColumns: {},
      tableData: [
        {
          id: 2381224,
          email: "michael.lawson@reqres.in",
          userName: "Michael Lawson",
          productName: "Chicken Sandwich",
          orderAmount: 4.99,
        },
        {
          id: 2736212,
          email: "lindsay.ferguson@reqres.in",
          userName: "Lindsay Ferguson",
          productName: "Tuna Salad",
          orderAmount: 9.99,
        },
        {
          id: 6788734,
          email: "tobias.funke@reqres.in",
          userName: "Tobias Funke",
          productName: "Beef steak",
          orderAmount: 19.99,
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
    },
    CHECKBOX_WIDGET: {
      rows: 1,
      columns: 3,
      label: "Label",
      defaultCheckedState: true,
      widgetName: "Checkbox",
      version: 1,
      alignWidget: "LEFT",
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
    },
    ALERT_WIDGET: {
      alertType: "NOTIFICATION",
      intent: "SUCCESS",
      rows: 3,
      columns: 3,
      header: "",
      message: "",
      widgetName: "Alert",
      version: 1,
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
    },
    TABS_WIDGET: {
      rows: 7,
      columns: 8,
      shouldScrollContents: false,
      widgetName: "Tabs",
      tabs: [
        { label: "Tab 1", id: "tab1", widgetId: "", isVisible: true },
        { label: "Tab 2", id: "tab2", widgetId: "", isVisible: true },
      ],
      shouldShowTabs: true,
      defaultTab: "Tab 1",
      blueprint: {
        operations: [
          {
            type: "MODIFY_PROPS",
            fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
              const tabs = [...widget.tabs];

              const newTabs = tabs.map((tab: any) => {
                const newTab = { ...tab };
                newTab.widgetId = generateReactKey();
                return newTab;
              });
              const updatePropertyMap = [
                {
                  widgetId: widget.widgetId,
                  propertyName: "tabs",
                  propertyValue: newTabs,
                },
              ];
              return updatePropertyMap;
            },
          },
        ],
      },
      version: 1,
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
                    type: "MODIFY_PROPS",
                    fn: (
                      widget: WidgetProps & { children?: WidgetProps[] },
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
      chartData: [
        {
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
      ],
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
  },
  configVersion: 1,
};

export default WidgetConfigResponse;
