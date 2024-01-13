import type { IconName } from "@blueprintjs/icons";
import type { IconButtonProps } from "@design-system/widgets";

export interface IconButtonComponentProps {
  tooltip?: string;
  visuallyDisabled?: boolean;
  isLoading: boolean;
  iconName?: IconName;
  isDisabled?: boolean;
  variant?: IconButtonProps["variant"];
  color?: IconButtonProps["color"];
  onPress?: IconButtonProps["onPress"];
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
}
