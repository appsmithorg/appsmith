import { CanvasReduxState } from "../reducers/uiReducers/canvasReducer";
import { IWidgetProps } from "../widgets/BaseWidget";
import ContainerWidget, { IContainerWidgetProps } from "../widgets/ContainerWidget";

const CanvasResponse: IContainerWidgetProps<any> = {
  widgetId: "0",
  widgetType: "CONTAINER_WIDGET",
  children: [
    {
      widgetId: "1",
      widgetType: "TEXT_WIDGET",
      topRow: 0,
      leftColumn: 2,
      bottomRow: 5,
      rightColumn: 5,
      parentColumnSpace: 100,
      parentRowSpace: 100,
      text: "whaat"
    }
  ],
  topRow: 0,
  bottomRow: 600,
  leftColumn: 0,
  rightColumn: 1200,
  parentColumnSpace: 1,
  parentRowSpace: 1
}

export default CanvasResponse
