import { WidgetCardsPaneReduxState } from "../reducers/uiReducers/widgetCardsPaneReducer";

const WidgetCardsPaneResponse: WidgetCardsPaneReduxState = {
  cards: {
    common: [
      {
        widgetType: "TEXT_WIDGET",
        icon: "icon-plus",
        label: "Text",
      },
      {
        widgetType: "IMAGE_WIDGET",
        icon: "icon-image",
        label: "Image",
      },
      {
        widgetType: "BUTTON_WIDGET",
        icon: "icon-button",
        label: "Button",
      },
      {
        widgetType: "SPINNER_WIDGET",
        icon: "icon-switch",
        label: "Spinner",
      },
      {
        widgetType: "CONTAINER_WIDGET",
        icon: "icon-container",
        label: "Container",
      },
    ],
    form: [
      {
        widgetType: "BUTTON_WIDGET",
        icon: "icon-button",
        label: "Button",
      },
      {
        widgetType: "BUTTON_WIDGET",
        icon: "icon-button",
        label: "Button",
      },
      {
        widgetType: "DROPDOWN_WIDGET",
        icon: "icon-dropdown",
        label: "Dropdown",
      },
      {
        widgetType: "DATEPICKER_WIDGET",
        icon: "icon-datepicker",
        label: "DatePicker",
      },
      {
        widgetType: "RADIO_BUTTON_WIDGET",
        icon: "icon-radio",
        label: "Radio Button",
      },
      {
        widgetType: "TOGGLE_WIDGET",
        icon: "icon-switch",
        label: "Toggle",
      },
    ],
    view: [
      {
        widgetType: "TEXT_WIDGET",
        icon: "icon-text",
        label: "Text",
      },
      {
        widgetType: "IMAGE_WIDGET",
        icon: "icon-image",
        label: "Image",
      },
      {
        widgetType: "CONTAINER_WIDGET",
        icon: "icon-container",
        label: "Container",
      },
      {
        widgetType: "MODAL_WIDGET",
        icon: "icon-modal",
        label: "Modal",
      },
      {
        widgetType: "SPINNER_WIDGET",
        icon: "icon-spinner",
        label: "Spinner",
      },
      {
        widgetType: "TABLE_WIDGET",
        icon: "icon-table",
        label: "Table",
      },
    ],
  },
};

export default WidgetCardsPaneResponse;
