import type { IconButtonProps } from "@design-system/widgets";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import type { IconName } from "@blueprintjs/icons";

export interface IconButtonWidgetProps extends WidgetProps {
  iconName: IconName;
  buttonColor: IconButtonProps["color"];
  buttonVariant: IconButtonProps["variant"];
  isDisabled: boolean;
  isVisible: boolean;
  onClick?: string;
}

export interface IconButtonWidgetState extends WidgetState {
  isLoading: boolean;
}
