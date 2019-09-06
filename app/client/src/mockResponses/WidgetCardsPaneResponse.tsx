import { WidgetCardsPaneReduxState } from "../reducers/uiReducers/widgetCardsPaneReducer";

const WidgetCardsPaneResponse: WidgetCardsPaneReduxState = {
  cards: {
    common: [
      {
        widgetType: "TEXT_WIDGET",
        icon: "appsmith-widget-text",
        label: "Container",
      },
      {
        widgetType: "CHECKBOX_WIDGET",
        icon: "appsmith-widget-checkbox",
        label: "Container",
      },
      {
        widgetType: "RADIO_GROUP_WIDGET",
        icon: "appsmith-widget-radio",
        label: "Container",
      },
      {
        widgetType: "BUTTON_WIDGET",
        icon: "appsmith-widget-button",
        label: "Button",
      },
      {
        widgetType: "INPUT_GROUP_WIDGET",
        icon: "appsmith-widget-input",
        label: "Input",
      },
      {
        widgetType: "SPINNER_WIDGET",
        icon: "appsmith-widget-switch",
        label: "Spinner",
      },
      {
        widgetType: "CONTAINER_WIDGET",
        icon: "appsmith-widget-modal",
        label: "Container",
      },
      {
        widgetType: "BREADCRUMBS_WIDGET",
        icon: "appsmith-widget-collapse",
        label: "Input",
      },{
        widgetType: "TAG_INPUT_WIDGET",
        icon: "appsmith-widget-dropdown",
        label: "Tag",
      },
      {
        widgetType: "NUMERIC_INPUT_WIDGET",
        icon: "appsmith-widget-table",
        label: "Numeric",
      }
    ],
    form: [
      {
        widgetType: "ICON_WIDGET",
        icon: "appsmith-widget-button",
        label: "Icon",
      },
      {
        widgetType: "CALLOUT_WIDGET",
        icon: "appsmith-widget-alert",
        label: "Callout",
      }
    ],
    view: [
      {
        widgetType: "INPUT_GROUP_WIDGET",
        icon: "appsmith-widget-input",
        label: "Input",
      }
    ]
  }
};


export default WidgetCardsPaneResponse;
