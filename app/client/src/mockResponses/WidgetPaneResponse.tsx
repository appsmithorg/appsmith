import { WidgetPaneReduxState } from "../reducers/uiReducers/widgetPaneReducer"
import { RenderModes } from "../constants/WidgetConstants"

const WidgetPaneResponse: WidgetPaneReduxState = {
  widgets: [
    {
      widgetType: "BUTTON_WIDGET",
      text: "Lorem Ipsum",
      renderMode: RenderModes.COMPONENT_PANE
    },
    {
      widgetType: "TEXT_WIDGET",
      text: "Lorem Ipsum",
      renderMode: RenderModes.COMPONENT_PANE
    },
    {
      widgetType: "SPINNER_WIDGET",
      renderMode: RenderModes.COMPONENT_PANE,
      backgroundColor: "#434343",
      topRow: 2,
      leftColumn: 5,
      bottomRow: 5,
      rightColumn: 5
    }
  ]
}

export default WidgetPaneResponse
