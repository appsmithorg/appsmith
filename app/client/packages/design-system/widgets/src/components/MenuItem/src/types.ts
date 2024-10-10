import type { IconProps } from "@appsmith/wds";
import type { MenuItemProps as AriaMenuItemProps } from "react-aria-components";

export interface MenuItemProps extends AriaMenuItemProps<object> {
  icon?: IconProps["name"];
  isSubMenuItem?: boolean;
}
