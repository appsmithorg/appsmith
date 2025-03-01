import type { ButtonProps, IconProps } from "@appsmith/wds";
import type { WidgetProps } from "widgets/BaseWidget";

export interface ConfigureMenuItems {
  label: string;
  id: string;
  config: {
    id: string;
    label: string;
    isVisible: boolean;
    isDisabled: boolean;
    onClick: string;
  };
}

export interface MenuButtonWidgetProps extends WidgetProps {
  label?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  sourceData?: Array<ConfigureMenuItems["config"]>;
  menuItemsSource: "static" | "dynamic";
  configureMenuItems: ConfigureMenuItems;
  menuItems: Record<string, ConfigureMenuItems["config"]>;
  triggerButtonIconName?: IconProps["name"];
  triggerButtonIconAlign?: ButtonProps["iconPosition"];
  triggerButtonVariant?: ButtonProps["variant"];
  triggerButtonColor?: ButtonProps["color"];
}
