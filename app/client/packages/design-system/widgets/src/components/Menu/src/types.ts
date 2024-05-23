import type {
  MenuProps as HeadlessMenuProps,
  MenuItemProps as HeadlessMenuItemProps,
} from "react-aria-components";
import type { Key } from "@react-types/shared";
import type { IconProps } from "../../Icon";

export interface MenuProps
  extends Omit<
    HeadlessMenuProps<MenuItem>,
    "slot" | "selectionMode" | "selectedKeys"
  > {
  /**
   * Whether the item has a submenu.
   */
  hasSubmenu?: boolean;
}

export interface MenuItem {
  id: Key;
  label?: string;
  icon?: IconProps["name"];
  isDisabled?: boolean;
  isSeparator?: boolean;
  childItems?: Iterable<MenuItem>;
  hasSubmenu?: boolean;
}

export interface MenuItemProps
  extends Omit<HeadlessMenuItemProps, "id">,
    MenuItem {}
