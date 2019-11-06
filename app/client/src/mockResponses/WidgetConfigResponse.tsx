import { WidgetConfigReducerState } from "../reducers/entityReducers/widgetConfigReducer";

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
    },
    TEXT_WIDGET: {
      text: "Label me",
      textStyle: "LABEL",
      rows: 1,
      columns: 2,
      widgetName: "Text",
    },
    IMAGE_WIDGET: {
      defaultImage: "",
      imageShape: "RECTANGLE",
      image: "",
      rows: 3,
      columns: 3,
      widgetName: "Image",
    },
    INPUT_WIDGET: {
      inputType: "TEXT",
      label: "Label me",
      rows: 1,
      columns: 5,
      widgetName: "Input",
    },
    SWITCH_WIDGET: {
      isOn: false,
      label: "Switch",
      rows: 1,
      columns: 4,
      widgetName: "Switch",
    },
    CONTAINER_WIDGET: {
      backgroundColor: "#FFFFFF",
      rows: 8,
      columns: 8,
      widgetName: "Container",
    },
    SPINNER_WIDGET: {
      rows: 1,
      columns: 1,
      widgetName: "Spinner",
    },
    DATE_PICKER_WIDGET: {
      enableTimePicker: true,
      datePickerType: "DATE_PICKER",
      rows: 1,
      dateFormat: "DD/MM/YYYY",
      columns: 3,
      label: "Date",
      widgetName: "DatePicker",
    },
    TABLE_WIDGET: {
      rows: 5,
      columns: 7,
      label: "Data",
      widgetName: "Table",
    },
    DROP_DOWN_WIDGET: {
      rows: 1,
      columns: 3,
      selectionType: "SINGLE_SELECT",
      label: "Select",
      options: [
        { label: "Option 1", value: "1" },
        { label: "Option 2", value: "2" },
        { label: "Option 3", value: "3" },
      ],
      widgetName: "Dropdown",
    },
    CHECKBOX_WIDGET: {
      rows: 1,
      columns: 3,
      label: "Label me",
      defaultCheckedState: true,
      widgetName: "Checkbox",
    },
    RADIO_GROUP_WIDGET: {
      rows: 3,
      columns: 3,
      label: "Labels",
      options: [
        { label: "Alpha", value: "1" },
        { label: "Bravo", value: "2" },
        { label: "Charlie", value: "3" },
      ],
      selectedOptionValue: "1",
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
      rows: 3,
      columns: 3,
      widgetName: "FilePicker",
    },
  },
  configVersion: 1,
};

export default WidgetConfigResponse;
