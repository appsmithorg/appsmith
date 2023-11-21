import React, { cloneElement, useRef, Children } from "react";
import { useMenuTriggerState } from "@react-stately/menu";
import { useMenuTrigger } from "@react-aria/menu";
import { Popover, PopoverTrigger, PopoverContent } from "../../Popover";

import type { ReactElement } from "react";
import type { MenuTriggerProps } from "@react-stately/menu";
import type { MenuProps } from "./types";

export const Menu = <T extends object>(props: MenuProps<T>) => {
  const {
    children,
    className,
    defaultOpen,
    isOpen,
    offset,
    onClose,
    placement,
    ...rest
  } = props;
  const [menuTrigger, menuList] = Children.toArray(children);

  const state = useMenuTriggerState({
    ...(menuList as MenuTriggerProps),
    isOpen,
    defaultOpen,
  });
  const ref = useRef(null);
  const { menuProps, menuTriggerProps } = useMenuTrigger<T>(
    {},
    {
      ...state,
      // Set focus on first item element
      focusStrategy: "first",
    },
    ref,
  );

  const handleOnClose = () => {
    state.setOpen(false);
    onClose ? onClose() : null;
  };

  return (
    <Popover
      isOpen={state.isOpen}
      offset={offset}
      placement={placement}
      setOpen={() => state.setOpen(!state.isOpen)}
    >
      <PopoverTrigger>
        {cloneElement(menuTrigger as ReactElement, {
          ...menuTriggerProps,
          ref,
        })}
      </PopoverTrigger>
      <PopoverContent contentClassName={className}>
        {cloneElement(menuList as ReactElement, {
          ...rest,
          ...menuProps,
          onClose: handleOnClose,
        })}
      </PopoverContent>
    </Popover>
  );
};
