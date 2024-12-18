import type { ButtonProps, IconProps } from "@appsmith/wds";
import type { WidgetProps } from "widgets/BaseWidget";

export interface ConfigureMenuItems {
  label: string;
  id: string;
  config: Record<string, unknown>;
}

export interface MenuButtonWidgetProps extends WidgetProps {
  label?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  sourceData?: Array<Record<string, unknown>>;
  menuItemsSource: "static" | "dynamic";
  configureMenuItems: ConfigureMenuItems;
  menuItems: Record<string, Record<string, unknown>>;
  getVisibleItems: () => Array<Record<string, unknown>>;
  triggerButtonIconName?: IconProps["name"];
  triggerButtonIconAlign?: ButtonProps["iconPosition"];
  triggerButtonVariant?: ButtonProps["variant"];
  triggerButtonColor?: ButtonProps["color"];
}
