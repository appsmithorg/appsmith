import type { MenuTriggerProps } from "@react-stately/menu";
import type { TreeState } from "@react-stately/tree";
import type { AriaMenuProps } from "@react-types/menu";
import type { Node } from "@react-types/shared";
import type { ReactElement } from "react";
import type { PopoverProps } from "../../Popover";

export interface MenuProps<T>
  extends AriaMenuProps<T>,
    MenuTriggerProps,
    Pick<PopoverProps, "placement" | "offset"> {
  children: ReactElement[];
  className?: string;
}

export interface MenuItemProps<T> {
  item: Node<T>;
  state: TreeState<T>;
  className?: string;
}

export interface MenuListProps<T> extends AriaMenuProps<T> {
  listClassName?: string;
  itemClassName?: string;
}
