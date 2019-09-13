import { WidgetCardsPaneReduxState } from "../reducers/uiReducers/widgetCardsPaneReducer";

const WidgetCardsPaneResponse: WidgetCardsPaneReduxState = {
  cards: {
    common: [
      {
        widgetType: "TEXT_WIDGET",
        icon: "icon-text",
        label: "Container",
      },
      {
        widgetType: "CHECKBOX_WIDGET",
        icon: "icon-checkbox",
        label: "Container",
      },
      {
        widgetType: "RADIO_GROUP_WIDGET",
        icon: "icon-radio",
        label: "Container",
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
        icon: "icon-modal",
        label: "Container",
      },
    ],
    form: [
      {
        widgetType: "BUTTON_WIDGET",
        icon: "appsmith-widget-button",
        label: "Button",
      },
    ],
    view: [
      {
        widgetType: "BUTTON_WIDGET",
        icon: "appsmith-widget-button",
        label: "Button",
      },
    ],
  },
};

export default WidgetCardsPaneResponse;
