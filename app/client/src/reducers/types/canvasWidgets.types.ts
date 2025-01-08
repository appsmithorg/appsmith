import type { WidgetProps } from "../../widgets/BaseWidget";

export type UpdateWidgetsPayload = Record<
  string,
  Array<{
    propertyPath: string;
    propertyValue: unknown;
  }>
>;

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}
