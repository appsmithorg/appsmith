import type { ButtonProps, COLORS, IconProps } from "@appsmith/wds";
import type { WidgetProps } from "widgets/BaseWidget";
import type { IconName } from "@blueprintjs/icons";

export interface MenuItem {
  // Meta
  id: string;
  index?: number;
  widgetId?: string;

  // General
  label?: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  onClick?: string;

  // Style
  iconName?: IconName;
  iconAlign?: "start" | "end";
  textColor?: keyof typeof COLORS;
}

export interface ConfigureMenuItems {
  label: string;
  id: string;
  config: MenuItem;
}

export interface MenuButtonWidgetProps extends WidgetProps {
  // General
  label?: string;
  isDisabled?: boolean;
  isVisible?: boolean;

  // Source data and menu items
  sourceData?: Array<Record<string, unknown>>;
  menuItemsSource: "static" | "dynamic";
  configureMenuItems: ConfigureMenuItems;
  menuItems: Record<string, MenuItem>;
  getVisibleItems: () => Array<MenuItem>;

  // Trigger button style
  triggerButtonIconName?: IconProps["name"];
  triggerButtonIconAlign?: ButtonProps["iconPosition"];
  triggerButtonVariant?: ButtonProps["variant"];
  triggerButtonColor?: ButtonProps["color"];
}
