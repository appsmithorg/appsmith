import { WidgetConfigReducerState } from "../reducers/entityReducers/widgetConfigReducer.tsx";

const WidgetConfigResponse: WidgetConfigReducerState = {
  BUTTON_WIDGET: {
    text: "Submit",
    buttonStyle: "PRIMARY_BUTTON",
    rows: 1,
    columns: 2,
  },
  TEXT_WIDGET: {
    text: "Not all labels are bad!",
    textStyle: "LABEL",
    rows: 1,
    columns: 3,
  },
  IMAGE_WIDGET: {
    defaultImage: "",
    imageShape: "RECTANGLE",
    image: "",
    rows: 3,
    columns: 3,
  },
  INPUT_WIDGET: {
    inputType: "TEXT",
    label: "Label me",
    rows: 1,
    columns: 3,
  },
  SWITCH_WIDGET: {
    isOn: false,
    label: "Turn me on",
    rows: 1,
    columns: 4,
  },
  CONTAINER_WIDGET: {
    backgroundColor: "#FFFFFF",
    rows: 1,
    columns: 4,
  },
  SPINNER_WIDGET: {
    rows: 1,
    columns: 1,
  },
  DATE_PICKER_WIDGET: {
    enableTime: false,
    datePickerType: "DATE_PICKER",
    rows: 1,
    columns: 3,
    label: "Date",
  },
  TABLE_WIDGET: {
    rows: 5,
    columns: 7,
    label: "Don't table me!",
  },
  DROP_DOWN_WIDGET: {
    rows: 1,
    columns: 3,
    selectionType: "SINGLE_SELECT",
    label: "Pick me!",
  },
  CHECKBOX_WIDGET: {
    rows: 1,
    columns: 3,
    label: "Label - CHECK!",
    defaultCheckedState: true,
  },
  RADIO_GROUP_WIDGET: {
    rows: 3,
    columns: 3,
    label: "Alpha - come in!",
    options: [
      { label: "Alpha", value: "1" },
      { label: "Bravo", value: "2" },
      { label: "Charlie", value: "3" },
    ],
    defaultOptionValue: "1",
  },
  ALERT_WIDGET: {
    alertType: "NOTIFICATION",
    intent: "SUCCESS",
    rows: 3,
    columns: 3,
    header: "",
    message: "",
  },
};

export default WidgetConfigResponse;
