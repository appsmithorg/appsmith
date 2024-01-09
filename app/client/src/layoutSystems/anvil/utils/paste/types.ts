import type { FlattenedWidgetProps } from "WidgetProvider/constants";

export interface CopiedWidgetData {
  widgetId: string;
  parentId: string;
  list: FlattenedWidgetProps[];
}
