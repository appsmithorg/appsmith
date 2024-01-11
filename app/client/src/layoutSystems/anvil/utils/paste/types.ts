import type { FlattenedWidgetProps } from "WidgetProvider/constants";

export interface CopiedWidgetData {
  hierarchy: number;
  list: FlattenedWidgetProps[];
  parentId: string;
  widgetId: string;
}
