import { WidgetPaneReduxState } from "../reducers/uiReducers/widgetPaneReducer"
import { RenderModes } from "../constants/WidgetConstants"

const WidgetPaneResponse: WidgetPaneReduxState = {
  widgets: [
    {
      widgetType: "BUTTON_WIDGET",
      text: "Lorem Ipsum",
      renderMode: RenderModes.COMPONENT_PANE,
      bottomRow: 50,
      widgetId: "wp1",
      rightColumn: 200
    },
    {
      widgetType: "TEXT_WIDGET",
      text: "Lorem Ipsum",
      renderMode: RenderModes.COMPONENT_PANE,
      bottomRow: 50,
      widgetId: "wp2",
      rightColumn: 200
    },
    {
      widgetType: "SPINNER_WIDGET",
      renderMode: RenderModes.COMPONENT_PANE,
      backgroundColor: "#434343",
      bottomRow: 50,
      widgetId: "wp3",
      rightColumn: 200
    }
  ]
}

export default WidgetPaneResponse
