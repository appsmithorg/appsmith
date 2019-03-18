import { WidgetPaneReduxState } from "../reducers/uiReducers/widgetPaneReducer";
import { RenderModes } from "../constants/WidgetConstants";

const WidgetPaneResponse: WidgetPaneReduxState = {
    widgets: [
      {
        widgetId: "1",
        widgetType: "BUTTON_WIDGET",
        text: "Lorem Ipsum",
        renderMode: RenderModes.COMPONENT_PANE
      }
    ]
}

export default WidgetPaneResponse