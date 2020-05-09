import { WidgetConfigReducerState } from "reducers/entityReducers/widgetConfigReducer";
import { WidgetProps } from "widgets/BaseWidget";
import moment from "moment-timezone";

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
    },
    TEXT_WIDGET: {
      text: "Label",
      textStyle: "LABEL",
      rows: 1,
      columns: 4,
      widgetName: "Text",
    },
    RICH_TEXT_EDITOR_WIDGET: {
      defaultText: "This is the initial <b>content</b> of the editor",
      rows: 5,
      columns: 8,
      isDisabled: false,
      isVisible: true,
      widgetName: "RichTextEditor",
      isDefaultClickDisabled: true,
    },
    IMAGE_WIDGET: {
      defaultImage:
        "https://www.cowgirlcontractcleaning.com/wp-content/uploads/sites/360/2018/05/placeholder-img-5.jpg",
      imageShape: "RECTANGLE",
      image: "",
      rows: 3,
      columns: 6,
      widgetName: "Image",
    },
    INPUT_WIDGET: {
      inputType: "TEXT",
      label: "Label",
      rows: 1,
      columns: 10,
      widgetName: "Input",
    },
    // SWITCH_WIDGET: {
    //   isOn: false,
    //   label: "Switch",
    //   rows: 1,
    //   columns: 4,
    //   widgetName: "Switch",
    // },
    ICON_WIDGET: {
      widgetName: "Icon",
      rows: 1,
      columns: 1,
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
    },
    DATE_PICKER_WIDGET: {
      isDisabled: false,
      datePickerType: "DATE_PICKER",
      rows: 1,
      dateFormat: "DD/MM/YYYY",
      columns: 10,
      label: "Date",
      widgetName: "DatePicker",
      defaultDate: moment().toISOString(true),
    },
    TABLE_WIDGET: {
      rows: 7,
      columns: 8,
      label: "Data",
      widgetName: "Table",
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
        {
          id: 7434532,
          email: "byron.fields@reqres.in",
          userName: "Byron Fields",
          productName: "Chicken Sandwich",
          orderAmount: 4.99,
        },
        {
          id: 7434532,
          email: "ryan.holmes@reqres.in",
          userName: "Ryan Holmes",
          productName: "Avocado Panini",
          orderAmount: 7.99,
        },
      ],
    },
    DROP_DOWN_WIDGET: {
      rows: 1,
      columns: 10,
      selectionType: "SINGLE_SELECT",
      label: "Select",
      options: [
        { label: "Option 1", value: "1" },
        { label: "Option 2", value: "2" },
        { label: "Option 3", value: "3" },
        { label: "Option 4", value: "4" },
        { label: "Option 5", value: "5" },
      ],
      widgetName: "Dropdown",
    },
    CHECKBOX_WIDGET: {
      rows: 1,
      columns: 3,
      label: "Label",
      defaultCheckedState: true,
      widgetName: "Checkbox",
    },
    RADIO_GROUP_WIDGET: {
      rows: 2,
      columns: 3,
      label: "Label",
      options: [
        { id: "1", label: "Alpha", value: "1" },
        { id: "2", label: "Bravo", value: "2" },
        { id: "3", label: "Charlie", value: "3" },
      ],
      defaultOptionValue: "1",
      widgetName: "RadioGroup",
    },
    ALERT_WIDGET: {
      alertType: "NOTIFICATION",
      intent: "SUCCESS",
      rows: 3,
      columns: 3,
      header: "",
      message: "",
      widgetName: "Alert",
    },
    FILE_PICKER_WIDGET: {
      rows: 1,
      files: [],
      label: "Select Files",
      columns: 4,
      widgetName: "FilePicker",
      isDefaultClickDisabled: true,
    },
    TABS_WIDGET: {
      rows: 7,
      columns: 8,
      shouldScrollContents: false,
      widgetName: "Tabs",
      tabs: [
        { label: "Tab 1", id: "tab1" },
        { label: "Tab 2", id: "tab2" },
      ],
      selectedTab: "Tab 1",
      blueprint: {
        view: [
          {
            type: "CANVAS_WIDGET",
            position: { top: 0, left: 0 },
            size: { rows: 6, cols: 16 },
            props: {
              containerStyle: "none",
              canExtend: false,
              detachFromLayout: true,
              children: [],
              tabId: "tab1",
            },
          },
          {
            type: "CANVAS_WIDGET",
            position: { top: 0, left: 0 },
            size: { rows: 6, cols: 16 },
            props: {
              containerStyle: "none",
              canExtend: false,
              detachFromLayout: true,
              children: [],
              tabId: "tab2",
            },
          },
        ],
      },
    },
    MODAL_WIDGET: {
      rows: 456,
      columns: 456,
      size: "MODAL_SMALL",
      canEscapeKeyClose: true,
      detachFromLayout: true,
      canOutsideClickClose: true,
      shouldScrollContents: true,
      isVisible: false,
      widgetName: "Modal",
      children: [],
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
              blueprint: {
                view: [
                  {
                    type: "ICON_WIDGET",
                    position: { left: 15, top: 0 },
                    size: { rows: 1, cols: 1 },
                    props: {
                      iconName: "cross",
                      iconSize: 24,
                      color: "#040627",
                    },
                  },
                  {
                    type: "TEXT_WIDGET",
                    position: { left: 0, top: 0 },
                    size: { rows: 1, cols: 15 },
                    props: {
                      text: "Modal Title",
                      textStyle: "HEADING",
                    },
                  },
                  {
                    type: "BUTTON_WIDGET",
                    position: { left: 10, top: 4 },
                    size: { rows: 1, cols: 3 },
                    props: {
                      text: "Cancel",
                      buttonStyle: "SECONDARY_BUTTON",
                    },
                  },
                  {
                    type: "BUTTON_WIDGET",
                    position: { left: 13, top: 4 },
                    size: { rows: 1, cols: 3 },
                    props: {
                      text: "Confirm",
                      buttonStyle: "PRIMARY_BUTTON",
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
                          child => child.type === "ICON_WIDGET",
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
    },
    CHART_WIDGET: {
      rows: 8,
      columns: 6,
      widgetName: "Chart",
      chartType: "LINE_CHART",
      chartName: "Sales on working days",
      allowHorizontalScroll: false,
      chartData: [
        {
          seriesName: "",
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
    },
    FORM_WIDGET: {
      rows: 13,
      columns: 6,
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
              blueprint: {
                view: [
                  {
                    type: "TEXT_WIDGET",
                    size: { rows: 1, cols: 12 },
                    position: { top: 0, left: 0 },
                    props: {
                      text: "Title",
                      textStyle: "HEADING",
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
                      resetFormOnClick: false,
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
    },
  },
  configVersion: 1,
};

export default WidgetConfigResponse;
