import type { IconButtonProps } from "@design-system/widgets";

export interface IconButtonComponentProps extends IconButtonProps {
  tooltip?: string;
  visuallyDisabled?: boolean;
  isLoading: boolean;
  iconName?: IconButtonProps["icon"];
  isDisabled?: boolean;
}
