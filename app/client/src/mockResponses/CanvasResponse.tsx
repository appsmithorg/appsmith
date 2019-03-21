import { CanvasReduxState } from "../reducers/uiReducers/canvasReducer"
import { IWidgetProps } from "../widgets/BaseWidget"
import ContainerWidget, {
  IContainerWidgetProps
} from "../widgets/ContainerWidget"
import { RenderModes } from "../constants/WidgetConstants"
import { Colors } from "../constants/StyleConstants"

const CanvasResponse: IContainerWidgetProps<any> = {
  widgetId: "0",
  widgetType: "CONTAINER_WIDGET",
  snapColumns: 10,
  snapRows: 10,
  topRow: 100,
  bottomRow: 700,
  leftColumn: 100,
  rightColumn: 800,
  parentColumnSpace: 1,
  parentRowSpace: 1,
  renderMode: RenderModes.CANVAS,
  children: [
    {
      widgetId: "1",
      widgetType: "TEXT_WIDGET",
      topRow: 2,
      leftColumn: 1,
      bottomRow: 5,
      rightColumn: 3,
      text: "Lorem Ipsum asda asd kjhsadjhas kdh kashkjdas kdhas d as",
      renderMode: RenderModes.CANVAS
    },
    {
      widgetId: "2",
      widgetType: "BUTTON_WIDGET",
      topRow: 2,
      leftColumn: 4,
      bottomRow: 5,
      rightColumn: 5,
      text: "Lorem Ipsum",
      renderMode: RenderModes.CANVAS
    },
    {
      widgetId: "3",
      widgetType: "INPUT_GROUP_WIDGET",
      topRow: 1,
      leftColumn: 1,
      bottomRow: 1,
      rightColumn: 5,
      placeholder: "Lorem Ipsum",
      renderMode: RenderModes.CANVAS
    },
    {
      widgetId: "4",
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
      widgetId: "5",
      widgetType: "ICON_WIDGET",
      topRow: 4,
      leftColumn: 2,
      bottomRow: 5,
      rightColumn: 3,
      icon: "globe",
      iconSize: "20",
      intent: "warning",
      renderMode: RenderModes.CANVAS
    },
    {
      widgetId: "6",
      widgetType: "SPINNER_WIDGET",
      topRow: 5,
      leftColumn: 6,
      bottomRow: 5,
      rightColumn: 5,
      size: 20
    },
    {
      widgetId: "6",
      widgetType: "BREADCRUMBS_WIDGET",
      topRow: 6,
      leftColumn: 2,
      bottomRow: 5,
      rightColumn: 5,
      width: "100%",
      collapseFrom: "start",
      className: "breadcrumbs",
      size: 20,
      renderMode: RenderModes.CANVAS,
      items: [
        { icon: "folder-close", text: "All files" },
        { icon: "folder-close", text: "Users" },
        { icon: "folder-close", text: "Janet" },
        { href: "#", icon: "folder-close", text: "Photos" },
        { href: "#", icon: "folder-close", text: "Wednesday" },
        { icon: "document", text: "image.jpg" }
      ]
    },
    {
      widgetId: "7",
      widgetType: "TAG_INPUT_WIDGET",
      topRow: 7,
      leftColumn: 1,
      bottomRow: 5,
      rightColumn: 5,
      palceholder: "Lorem, Ipsum",
      values: ["abx", "somf", "soke"],
      renderMode: RenderModes.CANVAS
    },
    {
      widgetId: "8",
      widgetType: "NUMERIC_INPUT_WIDGET",
      topRow: 4,
      leftColumn: 1,
      bottomRow: 5,
      rightColumn: 5,
      palceholder: "Numeric input",
      allowNumericCharactersOnly: true,
      renderMode: RenderModes.CANVAS
    },
    {
      widgetId: "8",
      widgetType: "CHECKBOX_WIDGET",
      topRow: 6,
      leftColumn: 1,
      bottomRow: 5,
      rightColumn: 5,
      items: [
        {
          label: "a",
          value: 1
        },
        {
          label: "b",
          value: 2
        },
        {
          label: "c",
          value: 3
        }
      ]
    },
    {
      widgetId: "9",
      widgetType: "RADIO_GROUP_WIDGET",
      topRow: 6,
      leftColumn: 1,
      bottomRow: 5,
      rightColumn: 5,
      items: [
        {
          label: "a",
          value: 1
        },
        {
          label: "b",
          value: 2
        },
        {
          label: "c",
          value: 3
        }
      ]
    }
  ]
}

export default CanvasResponse
