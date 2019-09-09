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
        widgetType: "INPUT_GROUP_WIDGET",
        icon: "icon-input",
        label: "Input",
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
      {
        widgetType: "BREADCRUMBS_WIDGET",
        icon: "icon-collapse",
        label: "Input",
      },{
        widgetType: "TAG_INPUT_WIDGET",
        icon: "icon-dropdown",
        label: "Tag",
      },
      {
        widgetType: "NUMERIC_INPUT_WIDGET",
        icon: "icon-table",
        label: "Numeric",
      }
    ],
    form: [
      {
        widgetType: "ICON_WIDGET",
        icon: "icon-button",
        label: "Icon",
      },
      {
        widgetType: "CALLOUT_WIDGET",
        icon: "icon-alert",
        label: "Callout",
      }
    ],
    view: [
      {
        widgetType: "INPUT_GROUP_WIDGET",
        icon: "icon-input",
        label: "Input",
      }
    ]
  }
};


export default WidgetCardsPaneResponse;
