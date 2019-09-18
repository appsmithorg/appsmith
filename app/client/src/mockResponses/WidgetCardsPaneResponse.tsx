import { WidgetCardsPaneReduxState } from "../reducers/uiReducers/widgetCardsPaneReducer";
import { generateReactKey } from "../utils/generators";

const WidgetCardsPaneResponse: WidgetCardsPaneReduxState = {
  cards: {
    common: [
      {
        widgetType: "TEXT_WIDGET",
        icon: "icon-plus",
        label: "Text",
        key: generateReactKey(),
      },
      {
        widgetType: "IMAGE_WIDGET",
        icon: "icon-image",
        label: "Image",
        key: generateReactKey(),
      },
      {
        widgetType: "BUTTON_WIDGET",
        icon: "icon-button",
        label: "Button",
        key: generateReactKey(),
      },
      {
        widgetType: "SPINNER_WIDGET",
        icon: "icon-switch",
        label: "Spinner",
        key: generateReactKey(),
      },
      {
        widgetType: "CONTAINER_WIDGET",
        icon: "icon-container",
        label: "Container",
        key: generateReactKey(),
      },
    ],
    form: [
      {
        widgetType: "BUTTON_WIDGET",
        icon: "icon-button",
        label: "Button",
        key: generateReactKey(),
      },
      {
        widgetType: "BUTTON_WIDGET",
        icon: "icon-button",
        label: "Button",
        key: generateReactKey(),
      },
      {
        widgetType: "DROP_DOWN_WIDGET",
        icon: "icon-dropdown",
        label: "Dropdown",
        key: generateReactKey(),
      },
      {
        widgetType: "DATE_PICKER_WIDGET",
        icon: "icon-datepicker",
        label: "DatePicker",
        key: generateReactKey(),
      },
      {
        widgetType: "RADIO_GROUP_WIDGET",
        icon: "icon-radio",
        label: "Radio Button",
        key: generateReactKey(),
      },
      {
        widgetType: "SWITCH_WIDGET",
        icon: "icon-switch",
        label: "Toggle",
        key: generateReactKey(),
      },
    ],
    view: [
      {
        widgetType: "TEXT_WIDGET",
        icon: "icon-text",
        label: "Text",
        key: generateReactKey(),
      },
      {
        widgetType: "IMAGE_WIDGET",
        icon: "icon-image",
        label: "Image",
        key: generateReactKey(),
      },
      {
        widgetType: "CONTAINER_WIDGET",
        icon: "icon-container",
        label: "Container",
        key: generateReactKey(),
      },
      {
        widgetType: "SPINNER_WIDGET",
        icon: "icon-spinner",
        label: "Spinner",
        key: generateReactKey(),
      },
      {
        widgetType: "TABLE_WIDGET",
        icon: "icon-table",
        label: "Table",
        key: generateReactKey(),
      },
    ],
  },
};

export default WidgetCardsPaneResponse;
