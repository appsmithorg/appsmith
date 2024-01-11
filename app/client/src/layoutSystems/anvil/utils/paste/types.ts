import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { WidgetLayoutPositionInfo } from "../layouts/widgetPositionUtils";

export interface CopiedWidgetData {
  hierarchy: number;
  list: FlattenedWidgetProps[];
  parentId: string;
  widgetId: string;
  widgetPositionInfo: WidgetLayoutPositionInfo | null;
}
