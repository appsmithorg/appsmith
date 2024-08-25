import type { WidgetProps } from "widgets/BaseWidget";
import type { COLORS, IconProps } from "@appsmith/wds";

export interface StatsWidgetProps extends WidgetProps {
  label?: string;
  value?: string;
  iconName?: IconProps["name"] | "(none)";
  iconAlign?: "start" | "end";
  valueChange?: string;
  valueChangeColor: keyof typeof COLORS;
  valueColor?: "default" | keyof typeof COLORS;
  caption?: string;
}
