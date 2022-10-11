import { WidgetProps } from "widgets/BaseWidget";
import { Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import {
  ButtonBorderRadius,
  ButtonVariant,
  ButtonPlacement,
} from "components/constants";

export enum MenuItemsSource {
  STATIC = "STATIC",
  DYNAMIC = "DYNAMIC",
}

export interface MenuButtonWidgetProps extends WidgetProps {
  label?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isCompact?: boolean;
  menuItems: Record<
    string,
    {
      widgetId: string;
      id: string;
      index: number;
      isVisible?: boolean;
      isDisabled?: boolean;
      label?: string;
      backgroundColor?: string;
      textColor?: string;
      iconName?: IconName;
      iconColor?: string;
      iconAlign?: Alignment;
      onClick?: string;
    }
  >;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius: ButtonBorderRadius;
  boxShadow?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  placement?: ButtonPlacement;
  menuItemsSource: MenuItemsSource;
}
