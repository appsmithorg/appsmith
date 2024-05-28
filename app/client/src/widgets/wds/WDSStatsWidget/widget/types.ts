import type { WidgetProps } from "widgets/BaseWidget";
import type { COLORS, IconProps } from "@design-system/widgets";

export interface StatsWidgetProps extends WidgetProps {
  label?: string;
  value?: string;
  iconName?: IconProps["name"] | "(none)";
  iconAlign?: "start" | "end";
  valueChange?: string;
  valueChangeColor: keyof typeof COLORS;
  valueColor?: keyof typeof COLORS;
  caption?: string;
}
