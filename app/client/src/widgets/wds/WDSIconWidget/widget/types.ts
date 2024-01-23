import type { IconProps } from "@design-system/widgets";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";

export interface IconWidgetProps extends WidgetProps {
  iconName: IconProps["name"];
  isVisible: boolean;
  onClick?: string;
  iconStyle?: "filled" | "outlined";
}

export interface IconWidgetState extends WidgetState {
  isLoading: boolean;
}
