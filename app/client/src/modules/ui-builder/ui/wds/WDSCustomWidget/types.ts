import type { WidgetProps } from "widgets/BaseWidget";

export interface CustomWidgetProps extends WidgetProps {
  events: string[];
}
