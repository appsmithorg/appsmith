import React from "react";
import { useMenuItem } from "@react-aria/menu";
import type { MenuItemProps } from "./types";
import { Icon as HeadlessIcon } from "../../Icon";

export const MenuItem = <T extends object>(props: MenuItemProps<T>) => {
  const { className, item, state } = props;
  const ref = React.useRef(null);
  const { isDisabled, isFocused, isPressed, isSelected, menuItemProps } =
    useMenuItem({ key: item.key }, state, ref);

  const Icon = item.props.icon;

  return (
    <li
      {...menuItemProps}
      className={className}
      data-active={isPressed ? "" : undefined}
      data-disabled={isDisabled ? "" : undefined}
      data-focused={isFocused ? "" : undefined}
      data-hovered={isFocused ? "" : undefined}
      data-icon-position={
        Boolean(item.props.iconPosition) ? item.props.iconPosition : "start"
      }
      data-selected={isSelected ? "" : undefined}
      ref={ref}
    >
      {Boolean(Icon) && (
        <HeadlessIcon>
          <Icon />
        </HeadlessIcon>
      )}
      <span data-text>{item.rendered}</span>
    </li>
  );
};
