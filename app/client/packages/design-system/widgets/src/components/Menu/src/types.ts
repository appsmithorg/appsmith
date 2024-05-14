import type {
  MenuProps as HeadlessMenuProps,
  MenuItemProps as HeadlessMenuItemProps,
} from "react-aria-components";
import type { IconProps } from "../../Icon";

export interface MenuProps extends Omit<HeadlessMenuProps<MenuItem>, "slot"> {
  hasSubmenu?: boolean;
}

export interface MenuItem {
  id: string | number;
  label?: string;
  icon?: IconProps["name"];
  isSeparator?: boolean;
  childItems?: Iterable<MenuItem>;
  hasSubmenu?: boolean;
}

export interface MenuItemProps
  extends Omit<HeadlessMenuItemProps, "id">,
    MenuItem {}
