import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { useBaseWidget } from "./useBaseWidget";
export interface BaseWidgetProps extends WidgetProps, WidgetState {}

export const withBaseWidget = (
  props: BaseWidgetProps,
  wigdet: (widgetData: any) => JSX.Element,
) => {
  const baseWidgetUtilityProps = useBaseWidget(props);
  const appsmithWidgetRender = 
};