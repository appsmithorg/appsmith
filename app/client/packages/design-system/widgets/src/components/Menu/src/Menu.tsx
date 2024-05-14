import React from "react";
import { Popover } from "@design-system/widgets";
import { Menu as HeadlessMenu, SubmenuTrigger } from "react-aria-components";
import { MenuItem } from "./MenuItem";
import styles from "./styles.module.css";
import type { MenuProps, MenuItemProps } from "./types";

export const Menu = (props: MenuProps) => {
  const { hasSubmenu = false } = props;
  // place Popover in the root theme provider to get access to the CSS tokens
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  return (
    <Popover UNSTABLE_portalContainer={hasSubmenu ? undefined : root}>
      <HeadlessMenu className={styles.menu} {...props}>
        {(item) => renderFunc(item, props)}
      </HeadlessMenu>
    </Popover>
  );
};

const renderFunc = (item: MenuItemProps, props: MenuProps) => {
  const { childItems, ...rest } = item;
  if (childItems != null) {
    return (
      <SubmenuTrigger {...rest}>
        <MenuItem hasSubmenu {...rest} />
        <Menu hasSubmenu items={childItems}>
          {(item) => renderFunc(item, props)}
        </Menu>
      </SubmenuTrigger>
    );
  } else {
    return <MenuItem {...rest} />;
  }
};
