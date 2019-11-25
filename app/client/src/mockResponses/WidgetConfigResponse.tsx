import { WidgetConfigReducerState } from "reducers/entityReducers/widgetConfigReducer";

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
      columns: 3,
      widgetName: "Text",
    },
    IMAGE_WIDGET: {
      defaultImage:
        "https://www.cowgirlcontractcleaning.com/wp-content/uploads/sites/360/2018/05/placeholder-img-5.jpg",
      imageShape: "RECTANGLE",
      image: "",
      rows: 3,
      columns: 3,
      widgetName: "Image",
    },
    INPUT_WIDGET: {
      inputType: "TEXT",
      label: "Label me",
      rows: 2,
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
      rows: 10,
      columns: 15,
      label: "Data",
      widgetName: "Table",
      tableData: [
        {
          Id: 7,
          Email: "michael.lawson@reqres.in",
          "First Name": "Michael",
          "Last Name": "Lawson",
          Avatar:
            "https://s3.amazonaws.com/uifaces/faces/twitter/follettkyle/128.jpg",
        },
        {
          Id: 8,
          Email: "lindsay.ferguson@reqres.in",
          "First Name": "Lindsay",
          "Last Name": "Ferguson",
          Avatar:
            "https://s3.amazonaws.com/uifaces/faces/twitter/araa3185/128.jpg",
        },
        {
          Id: 9,
          Email: "tobias.funke@reqres.in",
          "First Name": "Tobias",
          "Last Name": "Funke",
          Avatar:
            "https://s3.amazonaws.com/uifaces/faces/twitter/vivekprvr/128.jpg",
        },
        {
          Id: 10,
          Email: "byron.fields@reqres.in",
          "First Name": "Byron",
          "Last Name": "Fields",
          Avatar:
            "https://s3.amazonaws.com/uifaces/faces/twitter/russoedu/128.jpg",
        },
        {
          Id: 11,
          Email: "george.edwards@reqres.in",
          "First Name": "George",
          "Last Name": "Edwards",
          Avatar:
            "https://s3.amazonaws.com/uifaces/faces/twitter/mrmoiree/128.jpg",
        },
        {
          Id: 12,
          Email: "rachel.howell@reqres.in",
          "First Name": "Rachel",
          "Last Name": "Howell",
          Avatar:
            "https://s3.amazonaws.com/uifaces/faces/twitter/hebertialmeida/128.jpg",
        },
      ],
    },
    DROP_DOWN_WIDGET: {
      rows: 1,
      columns: 3,
      selectionType: "SINGLE_SELECT",
      label: "Select",
      options: [
        { id: "1", label: "Option 1", value: "1" },
        { id: "2", label: "Option 2", value: "2" },
        { id: "3", label: "Option 3", value: "3" },
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
        { id: "1", label: "Alpha", value: "1" },
        { id: "2", label: "Bravo", value: "2" },
        { id: "3", label: "Charlie", value: "3" },
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
