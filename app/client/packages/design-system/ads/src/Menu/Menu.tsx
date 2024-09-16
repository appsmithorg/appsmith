import React from "react";
import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import clsx from "classnames";

import {
  StyledMenuContent,
  StyledMenuItem,
  StyledMenuGroupname,
  StyledMenuSubContent,
  StyledMenuSubTrigger,
  StyledMenuSeparator,
} from "./Menu.styles";
import type {
  MenuContentProps,
  MenuItemContentProps,
  MenuItemProps,
  MenuProps,
  MenuSubContentProps,
  MenuSubTriggerProps,
} from "./Menu.types";
import {
  MenuClassName,
  MenuItemChildrenClassName,
  MenuItemClassName,
  MenuItemEndIconClassName,
  MenuItemStartIconClassName,
  MenuSeparatorClassName,
  SIDE_OFFSET,
  SubMenuClassName,
} from "./Menu.constants";
import { Icon } from "../Icon";
import { Text } from "../Text";

function MenuContent({
  children,
  className,
  height,
  portalProps,
  width,
  ...props
}: MenuContentProps) {
  return (
    <RadixMenu.Portal {...portalProps}>
      <StyledMenuContent
        className={clsx(MenuClassName, className)}
        height={height}
        sideOffset={SIDE_OFFSET}
        width={width}
        {...props}
      >
        {children}
      </StyledMenuContent>
    </RadixMenu.Portal>
  );
}

function MenuSubContent({
  children,
  className,
  height,
  width,
  ...props
}: MenuSubContentProps) {
  return (
    <RadixMenu.Portal>
      <StyledMenuSubContent
        className={clsx(MenuClassName, SubMenuClassName, className)}
        height={height}
        sideOffset={SIDE_OFFSET}
        width={width}
        {...props}
      >
        {children}
      </StyledMenuSubContent>
    </RadixMenu.Portal>
  );
}

function MenuTrigger({
  children,
  ...props
}: RadixMenu.DropdownMenuTriggerProps) {
  return (
    <RadixMenu.Trigger asChild {...props}>
      {children}
    </RadixMenu.Trigger>
  );
}

function MenuItemContent(props: MenuItemContentProps) {
  const { children, endIcon, size = "md", startIcon } = props;
  return (
    <>
      {startIcon && (
        <Icon
          className={MenuItemStartIconClassName}
          name={startIcon}
          size={size}
        />
      )}
      <Text className={MenuItemChildrenClassName}>{children}</Text>
      {endIcon && (
        <Icon className={MenuItemEndIconClassName} name={endIcon} size={size} />
      )}
    </>
  );
}

const MenuItem = React.forwardRef(
  (
    {
      children,
      className,
      endIcon,
      size = "md",
      startIcon,
      ...props
    }: MenuItemProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    return (
      <StyledMenuItem
        className={clsx(MenuItemClassName, className)}
        ref={ref}
        size={size}
        {...props}
      >
        <MenuItemContent endIcon={endIcon} size={size} startIcon={startIcon}>
          {children}
        </MenuItemContent>
      </StyledMenuItem>
    );
  },
);
MenuItem.displayName = "MenuItem";

function MenuSubTrigger({
  children,
  className,
  size = "md",
  startIcon,
  ...props
}: MenuSubTriggerProps) {
  return (
    <StyledMenuSubTrigger
      className={clsx(MenuItemClassName, className)}
      size={size}
      {...props}
    >
      <MenuItemContent
        endIcon={"arrow-right-s-line"}
        size={size}
        startIcon={startIcon}
      >
        {children}
      </MenuItemContent>
    </StyledMenuSubTrigger>
  );
}

function MenuSeparator({
  className,
  ...props
}: RadixMenu.DropdownMenuSeparatorProps) {
  return (
    <StyledMenuSeparator
      className={clsx(MenuSeparatorClassName, className)}
      {...props}
    />
  );
}

function Menu(props: MenuProps) {
  return <RadixMenu.Root {...props} />;
}
const MenuSub = RadixMenu.Sub;
const MenuGroup = RadixMenu.Group;
const MenuGroupName = StyledMenuGroupname;

export {
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupName,
  MenuSubContent,
  MenuTrigger,
  MenuItem,
  MenuSub,
  MenuSubTrigger,
  MenuSeparator,
};
