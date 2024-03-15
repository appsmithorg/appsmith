import type { WidgetType } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/types";

export interface CanvasStructure {
  widgetName: string;
  widgetId: string;
  type: WidgetType;
  children?: CanvasStructure[];
}

export interface DSL extends WidgetProps {
  children?: DSL[];
}
