import type { IconButtonProps, IconProps } from "@design-system/widgets";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";

export interface IconButtonWidgetProps extends WidgetProps {
  iconName: IconProps["name"];
  buttonColor: IconButtonProps["color"];
  buttonVariant: IconButtonProps["variant"];
  isDisabled: boolean;
  isVisible: boolean;
  onClick?: string;
}

export interface IconButtonWidgetState extends WidgetState {
  isLoading: boolean;
}
