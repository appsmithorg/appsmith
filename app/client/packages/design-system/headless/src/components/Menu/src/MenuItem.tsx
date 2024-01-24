import React from "react";
import { useMenuItem } from "@react-aria/menu";
import type { MenuItemProps } from "./types";

export const MenuItem = <T extends object>(props: MenuItemProps<T>) => {
  const { className, item, state } = props;
  const ref = React.useRef(null);
  const { isDisabled, isFocused, isPressed, isSelected, menuItemProps } =
    useMenuItem({ key: item.key }, state, ref);

  const [icon, text] = item.rendered as [React.ReactNode, React.ReactNode];

  return (
    <li
      {...menuItemProps}
      className={className}
      data-active={isPressed ? "" : undefined}
      data-disabled={isDisabled ? "" : undefined}
      data-focused={isFocused ? "" : undefined}
      data-hovered={isFocused ? "" : undefined}
      data-selected={isSelected ? "" : undefined}
      ref={ref}
    >
      {icon}
      <span data-text="">{text}</span>
    </li>
  );
};
