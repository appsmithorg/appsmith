import type { WidgetProps } from "widgets/types";

export interface DSLWidget extends WidgetProps {
  children?: DSLWidget[];
}
