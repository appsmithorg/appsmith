import React, { useState } from "react";

import styled from "styled-components";
import { Classes, MenuItem } from "@blueprintjs/core";
import type { noop } from "lodash";
import _ from "lodash";

import type { CommonComponentProps } from "design-system-old";
import { getTypographyByKey } from "design-system-old";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { HeaderIcons } from "icons/HeaderIcons";
import { MenuDivider } from "design-system-old";

const ShareIcon = HeaderIcons.SHARE;

export enum MenuTypes {
  MENU = "menu",
  PARENT = "parent",
  RECONFIRM = "re-confirm",
  MENU_DIVIDER = "menu divider",
}

export interface MenuItemData {
  text: string;
  label?: string;
  labelElement?: React.ReactNode;
  onClick?: typeof noop;
  children?: MenuItemData[];
  className?: string;
  type: MenuTypes;
  isVisible: boolean;
  confirmText?: string;
  isOpensNewWindow?: boolean | undefined;
  style?: React.CSSProperties;
}

const StyledMenuItem = styled((props) => {
  // we are removing non input related props before passing them in the components
  // eslint-disable @typescript-eslint/no-unused-vars
  const omitProps = ["isConfirm"];

  return <MenuItem {..._.omit(props, omitProps)} />;
})`
  width: 240px;
  background: ${(props) =>
    props.theme.colors.navigationMenu.backgroundInactive};
  color: ${(props) => props.theme.colors.navigationMenu.contentInactive};
  border-radius: 0;
  ${getTypographyByKey("h5")};
  height: ${(props) => props.theme.navbarMenuHeight};
  line-height: ${(props) => props.theme.navbarMenuLineHeight};
  padding: 5px 10px;

  &&&:hover {
    color: ${(props) => props.theme.colors.navigationMenu.contentActive};
    background: ${(props) =>
      props.theme.colors.navigationMenu.backgroundActive};
    background-color: ${(props) =>
      props.theme.colors.navigationMenu.backgroundActive};
  }

  > .${Classes.MENU_ITEM_LABEL} {
    > span {
      height: 100%;
    }
    height: 100%;
    color: ${(props) => props.theme.colors.navigationMenu.label};
  }
`;

const ReconfirmStyledItem = styled(StyledMenuItem)<{ isConfirm: boolean }>`
  &&&:hover {
    color: ${(props) =>
      props.isConfirm
        ? props.theme.colors.navigationMenu.warning
        : props.theme.colors.navigationMenu.contentActive};
    background-color: ${(props) =>
      props.isConfirm
        ? props.theme.colors.navigationMenu.warningBackground
        : props.theme.colors.navigationMenu.backgroundActive};
  }
`;

type NavigationMenuItemProps = CommonComponentProps & {
  menuItemData: MenuItemData;
  setIsPopoverOpen: typeof noop;
  children?: React.ReactNode;
};

export function NavigationMenuItem({
  children,
  menuItemData,
  setIsPopoverOpen,
}: NavigationMenuItemProps) {
  const {
    className,
    confirmText,
    isOpensNewWindow,
    isVisible,
    label,
    onClick,
    style,
    text,
  } = menuItemData;

  const [confirm, setConfirm] = useState({
    isConfirm: false,
    text: text,
  });

  if (!isVisible) return null;

  const labelElement =
    menuItemData.labelElement ||
    (isOpensNewWindow && (
      <ShareIcon color={"#4b4848"} height={12} width={12} />
    ));

  const handleClick = (e: React.SyntheticEvent) => {
    setIsPopoverOpen(false);
    if (onClick) onClick(e);
    AnalyticsUtil.logEvent("APP_MENU_OPTION_CLICK", {
      option: text,
    });
  };

  const handleReconfirmClick = (e: React.SyntheticEvent) => {
    if (!confirm.isConfirm && confirmText) {
      setConfirm({
        isConfirm: true,
        text: confirmText,
      });
      e.preventDefault();
      e.stopPropagation();
    } else if (onClick) {
      setIsPopoverOpen(false);
      onClick(e);
      AnalyticsUtil.logEvent("APP_MENU_OPTION_CLICK", {
        option: text,
      });
      setConfirm({
        isConfirm: false,
        text: text,
      });
    }
  };

  switch (menuItemData.type) {
    case MenuTypes.MENU:
      return (
        <StyledMenuItem
          className={className}
          label={label}
          labelElement={labelElement}
          onClick={handleClick}
          style={style}
          text={text}
        />
      );
    case MenuTypes.PARENT:
      return (
        <StyledMenuItem
          className={className}
          label={label}
          style={style}
          text={confirm.text}
        >
          {children}
        </StyledMenuItem>
      );
    case MenuTypes.RECONFIRM:
      return (
        <ReconfirmStyledItem
          className={className}
          isConfirm={confirm.isConfirm}
          label={label}
          onClick={handleReconfirmClick}
          style={style}
          text={confirm.text}
        />
      );
    case MenuTypes.MENU_DIVIDER:
      return <MenuDivider className="!m-0" />;
    default:
      return null;
  }
}
