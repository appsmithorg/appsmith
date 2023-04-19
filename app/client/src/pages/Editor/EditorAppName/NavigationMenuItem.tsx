import React, { useState } from "react";

import {
  MenuItem,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  MenuSeparator,
} from "design-system";
import type { noop } from "lodash";

import type { CommonComponentProps } from "design-system-old";
import AnalyticsUtil from "utils/AnalyticsUtil";
import styled from "styled-components";

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

const ReconfirmMenuItem = styled(MenuItem)`
  .ads-v2-text {
    color: var(--ads-v2-color-fg-error);
  }
`;

type NavigationMenuItemProps = CommonComponentProps & {
  menuItemData: MenuItemData;
  setIsPopoverOpen: typeof noop;
  children?: React.ReactNode;
};

export function NavigationMenuItem({
  menuItemData,
  setIsPopoverOpen,
}: NavigationMenuItemProps) {
  const { confirmText, isVisible, text } = menuItemData;

  const [confirm, setConfirm] = useState({
    isConfirm: false,
    text: text,
  });

  if (!isVisible) return null;

  const handleClick = (e: React.SyntheticEvent, item: MenuItemData) => {
    setIsPopoverOpen(false);
    if (item.onClick) item.onClick(e);
    AnalyticsUtil.logEvent("APP_MENU_OPTION_CLICK", {
      option: item.text,
    });
  };

  const handleReconfirmClick = (
    e: React.SyntheticEvent,
    item: MenuItemData,
  ) => {
    if (!confirm.isConfirm && confirmText) {
      setConfirm({
        isConfirm: true,
        text: confirmText,
      });
      e.preventDefault();
      e.stopPropagation();
    } else if (item.onClick) {
      setIsPopoverOpen(false);
      item.onClick(e);
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
        <MenuItem onClick={(e) => handleClick(e, menuItemData)}>
          {menuItemData.text}
        </MenuItem>
      );
    case MenuTypes.PARENT:
      return (
        <MenuSub>
          <MenuSubTrigger>{menuItemData.text}</MenuSubTrigger>
          <MenuSubContent width="214px">
            {menuItemData?.children?.map((subitem, idx) => (
              <MenuItem
                endIcon={subitem?.isOpensNewWindow ? "share-box-line" : ""}
                key={idx}
                onClick={(e) => handleClick(e, subitem)}
              >
                <div className="flex justify-between">
                  {subitem.text}
                  {subitem?.labelElement}
                </div>
              </MenuItem>
            ))}
          </MenuSubContent>
        </MenuSub>
      );
    case MenuTypes.RECONFIRM:
      return (
        <ReconfirmMenuItem
          onClick={(e) => handleReconfirmClick(e, menuItemData)}
        >
          {confirm.text}
        </ReconfirmMenuItem>
      );
    case MenuTypes.MENU_DIVIDER:
      return <MenuSeparator />;
    default:
      return null;
  }
}
