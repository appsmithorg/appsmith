import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import withWidgetProps from "widgets/withWidgetProps";
import { useBaseWidgetRender } from "./useBaseWidgetRender";
export interface BaseWidgetProps extends WidgetProps, WidgetState {}

export const withBaseWidgetHOC = (Widget: (widgetData: any) => JSX.Element) => {
  const appsmithWidgetRender = useBaseWidgetRender();
  return appsmithWidgetRender(Widget);
};
