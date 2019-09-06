import { WidgetCardsPaneReduxState } from "../reducers/uiReducers/widgetCardsPaneReducer";

const WidgetCardsPaneResponse: WidgetCardsPaneReduxState = {
  cards: {
    common: [
      {
        widgetType: "BUTTON_WIDGET",
        icon: "appsmith-widget-button",
        label: "Button",
      },
    ],
    form: [
      {
        widgetType: "BUTTON_WIDGET",
        icon: "appsmith-widget-button",
        label: "Button",
      },
      {
        widgetType: "CALLOUT_WIDGET",
        icon: "appsmith-widget-alert",
        label: "Callout",
      }
    ],
    view: [
      {
        widgetType: "BUTTON_WIDGET",
        icon: "appsmith-widget-button",
        label: "Button",
      }
    ]
  }
};


export default WidgetCardsPaneResponse;
