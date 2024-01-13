import React, { useRef } from "react";
import { useMenu } from "@react-aria/menu";
import { useTreeState } from "@react-stately/tree";
import { MenuItem } from "./MenuItem";
import type { MenuListProps } from "./types";

export const MenuList = <T extends object>(props: MenuListProps<T>) => {
  const { itemClassName, listClassName } = props;
  const state = useTreeState(props);
  const ref = useRef(null);
  const { menuProps } = useMenu(props, state, ref);

  return (
    <ul {...menuProps} className={listClassName} ref={ref}>
      {[...state.collection].map((item) => (
        <MenuItem
          className={itemClassName}
          item={item}
          key={item.key}
          state={state}
        />
      ))}
    </ul>
  );
};
