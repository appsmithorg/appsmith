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
      widgetId: "2",
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
    },
    {
      widgetId: "3",
      widgetType: "CALLOUT_WIDGET",
      topRow: 3,
      leftColumn: 1,
      bottomRow: 5,
      rightColumn: 5,
      id: "sample_id",
      title: "Visually important content",
      description:
        "The component is a simple wrapper around the CSS API that provides props for modifiers and optional title element. Any additional HTML props will be spread to the rendered <div> element.",
      icon: "",
      intent: "primary"
    },
    {
      widgetId: "4",
      widgetType: "ICON_WIDGET",
      topRow: 4,
      leftColumn: 4,
      bottomRow: 5,
      rightColumn: 5,
      icon: "globe",
      iconSize: "20",
      intent: "primary"
    },
    {
      widgetId: "5",
      widgetType: "SPINNER_WIDGET",
      topRow: 5,
      leftColumn: 6,
      bottomRow: 5,
      rightColumn: 5,
      size: 20
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
