import { WidgetCardsPaneReduxState } from "../reducers/uiReducers/widgetCardsPaneReducer";

const WidgetCardsPaneResponse: WidgetCardsPaneReduxState = {
  cards: {
    common: [
      {
        widgetType: "BUTTON_WIDGET",
        icon: "\f243",
        label: "Button",
        groups: ["common", "form"]
      },
      {
        widgetType: "INPUT_WIDGET",
        icon: "\f243",
        label: "Input",
        groups: ["common", "form"]
      },
      {
        widgetType: "TOGGLE_WIDGET",
        icon: "\f205",
        label: "Toggle",
        groups: ["common", "view"]
      }
    ],
    form: [
      {
        widgetType: "BUTTON_WIDGET",
        icon: "\f243",
        label: "Button",
        groups: ["common", "form"]
      },
      {
        widgetType: "INPUT_WIDGET",
        icon: "\f243",
        label: "Input",
        groups: ["common", "form"]
      }
    ],
    view: [
      {
        widgetType: "TOGGLE_WIDGET",
        icon: "\f205",
        label: "Toggle",
        groups: ["common", "view"]
      }
    ]
  }
};
// const WidgetPaneResponse: WidgetPaneReduxState = {
//   widgets: [
//     {
//       widgetType: "BUTTON_WIDGET",
//       text: "Lorem Ipsum",
//       renderMode: RenderModes.COMPONENT_PANE,
//       bottomRow: 50,
//       widgetId: "wp1",
//       rightColumn: 200
//     },
//     {
//       widgetType: "TEXT_WIDGET",
//       text: "Lorem Ipsum",
//       renderMode: RenderModes.COMPONENT_PANE,
//       bottomRow: 50,
//       widgetId: "wp2",
//       rightColumn: 200
//     },
//     {
//       widgetType: "SPINNER_WIDGET",
//       renderMode: RenderModes.COMPONENT_PANE,
//       backgroundColor: "#434343",
//       bottomRow: 50,
//       widgetId: "wp3",
//       rightColumn: 200
//     }
//   ]
// }

export default WidgetCardsPaneResponse;
