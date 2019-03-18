import { CanvasReduxState } from "../reducers/uiReducers/canvasReducer";
import { IWidgetProps } from "../widgets/BaseWidget";
import ContainerWidget, {
  IContainerWidgetProps
} from "../widgets/ContainerWidget";
import { RenderModes } from "../constants/WidgetConstants";

const CanvasResponse: IContainerWidgetProps<any> = {
  widgetId: "0",
  widgetType: "CONTAINER_WIDGET",
  snapColumns: 10,
  snapRows: 10,
  topRow: 100,
  bottomRow: 700,
  leftColumn: 200,
  rightColumn: 800,
  parentColumnSpace: 1,
  parentRowSpace: 1,
  renderMode: RenderModes.CANVAS,
  children: [
    {
      widgetId: "1",
      widgetType: "TEXT_WIDGET",
      topRow: 2,
      leftColumn: 5,
      bottomRow: 5,
      rightColumn: 5,
      text: "Lorem Ipsum",
      renderMode: RenderModes.CANVAS
    },
    {
      widgetId: "1",
      widgetType: "BUTTON_WIDGET",
      topRow: 2,
      leftColumn: 7,
      bottomRow: 5,
      rightColumn: 5,
      text: "Lorem Ipsum",
      renderMode: RenderModes.CANVAS
    },
    {
      widgetId: "2",
      widgetType: "INPUT_GROUP_WIDGET",
      topRow: 1,
      leftColumn: 1,
      bottomRow: 5,
      rightColumn: 5,
      placeholder: "Lorem Ipsum",
      renderMode: RenderModes.CANVAS
    },
    {
      widgetId: "3",
      widgetType: "CALLOUT_WIDGET",
      topRow: 3,
      leftColumn: 2,
      bottomRow: 8,
      rightColumn: 4,
      id: "sample_id",
      title: "Visually important content",
      description:
        "The component is a simple wrapper around the CSS API that provides props for modifiers and optional title element. Any additional HTML props will be spread to the rendered <div> element.",
      icon: "",
      intent: "success",
      renderMode: RenderModes.CANVAS
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
      intent: "warning",
      renderMode: RenderModes.CANVAS
    },
    {
      widgetId: "5",
      widgetType: "SPINNER_WIDGET",
      topRow: 5,
      leftColumn: 6,
      bottomRow: 5,
      rightColumn: 5,
      size: 20,
      renderMode: RenderModes.CANVAS
    }
  ]
};

export default CanvasResponse;
