import type { WidgetProps } from "widgets/BaseWidget";
import type { COLORS, IconProps } from "@design-system/widgets";

export interface StatBoxWidgetProps extends WidgetProps {
  label?: string;
  value?: string;
  iconName?: IconProps["name"] | "(none)";
  iconAlign?: "start" | "end";
  valueChange?: string;
  valueImpact?: keyof typeof COLORS;
  sublabel?: string;
}
