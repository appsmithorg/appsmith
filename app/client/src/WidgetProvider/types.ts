import type { WidgetProps } from "widgets/BaseWidget";

export interface DSLWidget extends WidgetProps {
  children?: DSLWidget[];
}
