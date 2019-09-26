import { WidgetCardsPaneReduxState } from "../reducers/uiReducers/widgetCardsPaneReducer";
import { generateReactKey } from "../utils/generators";

const WidgetCardsPaneResponse: WidgetCardsPaneReduxState = {
  cards: {
    common: [
      {
        type: "TEXT_WIDGET",
        icon: "icon-text",
        label: "Text",
        key: generateReactKey(),
      },
      {
        type: "BUTTON_WIDGET",
        icon: "icon-button",
        label: "Button",
        key: generateReactKey(),
      },
      {
        type: "SPINNER_WIDGET",
        icon: "icon-switch",
        label: "Spinner",
        key: generateReactKey(),
      },
      {
        type: "CONTAINER_WIDGET",
        icon: "icon-container",
        label: "Container",
        key: generateReactKey(),
      },
    ],
    form: [
      {
        type: "BUTTON_WIDGET",
        icon: "icon-button",
        label: "Button",
        key: generateReactKey(),
      },
      {
        type: "BUTTON_WIDGET",
        icon: "icon-button",
        label: "Button",
        key: generateReactKey(),
      },
      {
        type: "DROP_DOWN_WIDGET",
        icon: "icon-dropdown",
        label: "Dropdown",
        key: generateReactKey(),
      },
      {
        type: "DATE_PICKER_WIDGET",
        icon: "icon-datepicker",
        label: "DatePicker",
        key: generateReactKey(),
      },
      {
        type: "RADIO_GROUP_WIDGET",
        icon: "icon-radio",
        label: "Radio Button",
        key: generateReactKey(),
      },
      {
        type: "SWITCH_WIDGET",
        icon: "icon-switch",
        label: "Toggle",
        key: generateReactKey(),
      },
    ],
    view: [
      {
        type: "TEXT_WIDGET",
        icon: "icon-text",
        label: "Text",
        key: generateReactKey(),
      },
      {
        type: "CONTAINER_WIDGET",
        icon: "icon-container",
        label: "Container",
        key: generateReactKey(),
      },
      {
        type: "SPINNER_WIDGET",
        icon: "icon-spinner",
        label: "Spinner",
        key: generateReactKey(),
      },
      {
        type: "TABLE_WIDGET",
        icon: "icon-table",
        label: "Table",
        key: generateReactKey(),
      },
    ],
  },
};

export default WidgetCardsPaneResponse;
