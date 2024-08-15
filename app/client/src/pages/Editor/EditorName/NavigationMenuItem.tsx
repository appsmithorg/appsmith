import React, { useState } from "react";
import { kebabCase } from "lodash";

import {
  MenuItem,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  MenuSeparator,
} from "@appsmith/ads";
import type { noop } from "lodash";

import type { CommonComponentProps } from "@appsmith/ads-old";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { MenuTypes } from "./types";

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
  startIcon?: string;
}

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
        <MenuItem
          data-testid={`t--editor-menu-${kebabCase(text)}`}
          onClick={(e) => handleClick(e, menuItemData)}
        >
          {menuItemData.text}
        </MenuItem>
      );
    case MenuTypes.PARENT:
      return (
        <MenuSub data-testid={`t--editor-menu-${kebabCase(text)}`}>
          <MenuSubTrigger>{menuItemData.text}</MenuSubTrigger>
          <MenuSubContent width="214px">
            {menuItemData?.children
              ?.filter((child) => child.isVisible)
              .map((subitem, idx) => (
                <MenuItem
                  endIcon={subitem?.isOpensNewWindow ? "share-box-line" : ""}
                  key={idx}
                  onClick={(e) => handleClick(e, subitem)}
                  startIcon={subitem?.startIcon}
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
        <MenuItem
          className="error-menuitem"
          data-testid={`t--editor-menu-${kebabCase(text)}`}
          onClick={(e) => handleReconfirmClick(e, menuItemData)}
        >
          {confirm.text}
        </MenuItem>
      );
    case MenuTypes.MENU_DIVIDER:
      return <MenuSeparator />;
    default:
      return null;
  }
}
