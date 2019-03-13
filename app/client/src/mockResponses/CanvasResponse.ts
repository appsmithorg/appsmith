import { CanvasReduxState } from "../reducers/uiReducers/canvasReducer";
import { IWidgetProps } from "../widgets/BaseWidget";
import ContainerWidget, {
  IContainerWidgetProps
} from "../widgets/ContainerWidget";

const CanvasResponse: IContainerWidgetProps<any> = {
  widgetId: "0",
  widgetType: "CONTAINER_WIDGET",
  snapColumns: 10,
  snapRows: 10,
  children: [
    {
      widgetId: "1",
      widgetType: "TEXT_WIDGET",
      topRow: 2,
      leftColumn: 5,
      bottomRow: 5,
      rightColumn: 5,
      text: "Lorem Ipsum"
    },
    {
      widgetId: "1",
      widgetType: "INPUT_TEXT_WIDGET",
      topRow: 1,
      leftColumn: 1,
      bottomRow: 5,
      rightColumn: 5,
      placeholder: "Lorem Ipsum",
      id: "sample_id",
      type: "number",
      required: false,
      minLength: "4",
      maxLength: "12",
      size: "30"
    }
  ],
  topRow: 0,
  bottomRow: 600,
  leftColumn: 0,
  rightColumn: 1200,
  parentColumnSpace: 1,
  parentRowSpace: 1
};

export default CanvasResponse;
