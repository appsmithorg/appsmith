import type { FlattenedWidgetProps } from "WidgetProvider/constants";

export type UpdateWidgetsPayload = Record<
  string,
  Array<{
    propertyPath: string;
    propertyValue: unknown;
  }>
>;

export type { FlattenedWidgetProps };
export type CanvasWidgetsReduxState = Record<string, FlattenedWidgetProps>;

// Re-export for backward compatibility
export type { FlattenedWidgetProps as default } from "WidgetProvider/constants";
