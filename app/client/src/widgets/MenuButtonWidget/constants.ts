import { WidgetProps } from "widgets/BaseWidget";
import { Alignment } from "@blueprintjs/core";
import { IconName, IconNames } from "@blueprintjs/icons";
import {
  ButtonBorderRadius,
  ButtonVariant,
  ButtonPlacement,
} from "components/constants";
import { RenderMode } from "constants/WidgetConstants";

export enum MenuItemsSource {
  STATIC = "STATIC",
  DYNAMIC = "DYNAMIC",
}

export interface MenuItem {
  widgetId?: string;
  index?: number;
  id: string;
  label?: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  onClick?: string;
  backgroundColor?: string;
  textColor?: string;
  iconName?: IconName;
  iconColor?: string;
  iconAlign?: Alignment;
}

export interface ConfigureMenuItems {
  label: string;
  id: string;
  config: MenuItem;
}

export interface MenuButtonWidgetProps extends WidgetProps {
  label?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isCompact?: boolean;
  menuItems: Record<string, MenuItem>;
  getVisibleItems: () => Array<MenuItem>;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius: ButtonBorderRadius;
  boxShadow?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  placement?: ButtonPlacement;
  menuItemsSource: MenuItemsSource;
  configureMenuItems: ConfigureMenuItems;
  sourceData?: Array<Record<string, unknown>>;
  sourceDataKeys?: Array<string>;
}

export interface MenuButtonComponentProps {
  label?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isCompact?: boolean;
  menuItems: Record<string, MenuItem>;
  getVisibleItems: () => Array<MenuItem>;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius: string;
  boxShadow?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  onItemClicked: (onClick: string | undefined, index: number) => void;
  backgroundColor?: string;
  placement?: ButtonPlacement;
  width: number;
  widgetId: string;
  menuDropDownWidth: number;
  renderMode?: RenderMode;
  menuItemsSource: MenuItemsSource;
  configureMenuItems: ConfigureMenuItems;
  sourceData?: Array<Record<string, unknown>>;
  sourceDataKeys?: Array<string>;
}

export interface PopoverContentProps {
  menuItems: Record<string, MenuItem>;
  getVisibleItems: () => Array<MenuItem>;
  onItemClicked: (onClick: string | undefined, index: number) => void;
  isCompact?: boolean;
  borderRadius?: string;
  backgroundColor?: string;
  menuItemsSource: MenuItemsSource;
  configureMenuItems: ConfigureMenuItems;
  sourceData?: Array<Record<string, unknown>>;
  sourceDataKeys?: Array<string>;
}

export const ICON_NAMES = Object.keys(IconNames).map(
  (name: string) => IconNames[name as keyof typeof IconNames],
);
