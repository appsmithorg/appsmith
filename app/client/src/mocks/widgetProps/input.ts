import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

export const inputProps: BaseWidgetProps = {
  type: "INPUT_WIDGET_V2",
  widgetId: "1",
  widgetName: "Input1",
  renderMode: "CANVAS",
  version: 1,
  isLoading: false,
  parentColumnSpace: 10,
  parentRowSpace: 10,
  leftColumn: 0,
  rightColumn: 10,
  topRow: 0,
  bottomRow: 7,
};

export const mainContainerProps: BaseWidgetProps = {
  type: "CANVAS_WIDGET",
  widgetId: "0",
  widgetName: "MainContainer",
  renderMode: "CANVAS",
  version: 1,
  isLoading: false,
  parentColumnSpace: 10,
  parentRowSpace: 10,
  leftColumn: 0,
  rightColumn: 10,
  topRow: 0,
  bottomRow: 7,
};
