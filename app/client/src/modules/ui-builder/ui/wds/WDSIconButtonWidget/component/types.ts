import type { IconButtonProps } from "@appsmith/wds";

export interface IconButtonComponentProps extends IconButtonProps {
  tooltip?: string;
  visuallyDisabled?: boolean;
  isLoading: boolean;
  iconName?: IconButtonProps["icon"];
  isDisabled?: boolean;
}
