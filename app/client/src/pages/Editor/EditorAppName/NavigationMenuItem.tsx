import React, { useState } from "react";

import styled from "styled-components";
import { MenuItem } from "@blueprintjs/core";
import { noop } from "lodash";

import {
  NAVIGATION_BAR_MENU_WIDTH,
  NAVIGATION_BAR_CONTENT_COLOR,
  NAVIGATION_BAR_BACKGROUND_COLOR,
} from "constants/NavigationConstants";
import { CommonComponentProps } from "components/ads/common";
import Icon, { IconSize } from "components/ads/Icon";

export enum MenuTypes {
  MENU = "menu",
  PARENT = "parent",
  RECONFIRM = "re-confirm",
}

export interface MenuItemData {
  text: string;
  label?: string;
  onClick?: typeof noop;
  children?: MenuItemData[];
  type: MenuTypes;
  isVisible: boolean;
  confirmText?: string;
  isOpensNewWindow?: boolean | undefined;
  style?: React.CSSProperties;
}

const StyledMenuItem = styled(MenuItem)`
  width: ${NAVIGATION_BAR_MENU_WIDTH};
  background: ${NAVIGATION_BAR_BACKGROUND_COLOR};
  color: ${NAVIGATION_BAR_CONTENT_COLOR};
  border-radius: 0;

  :hover {
    color: ${NAVIGATION_BAR_CONTENT_COLOR};
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

  const labelElement = isOpensNewWindow && (
    <Icon name="open" size={IconSize.LARGE} />
  );

  const handleClick = (e: React.SyntheticEvent) => {
    setIsPopoverOpen(false);
    if (onClick) onClick(e);
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
          label={label}
          labelElement={labelElement}
          onClick={handleClick}
          style={style}
          text={text}
        />
      );
    case MenuTypes.PARENT:
      return (
        <StyledMenuItem label={label} style={style} text={confirm.text}>
          {children}
        </StyledMenuItem>
      );
    case MenuTypes.RECONFIRM:
      return (
        <StyledMenuItem
          label={label}
          onClick={handleReconfirmClick}
          style={style}
          text={confirm.text}
        />
      );
  }

  return null;
}
