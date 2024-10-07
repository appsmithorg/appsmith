import React, { createContext, useContext } from "react";
import { listStyles, Popover } from "@appsmith/wds";
import { Menu as HeadlessMenu } from "react-aria-components";

import type { MenuProps } from "./types";

const MenuNestingContext = createContext(0);

export const Menu = (props: MenuProps) => {
  const { children } = props;
  const root = document.body.querySelector(
    "[data-theme-provider]",
  ) as HTMLButtonElement;

  const nestingLevel = useContext(MenuNestingContext);
  const isRootMenu = nestingLevel === 0;

  return (
    <MenuNestingContext.Provider value={nestingLevel + 1}>
      {/* Only the parent Popover should be placed in the root. Placing child popoves in root would cause the menu to function incorrectly */}
      <Popover UNSTABLE_portalContainer={isRootMenu ? root : undefined}>
        <HeadlessMenu className={listStyles.listBox} {...props}>
          {children}
        </HeadlessMenu>
      </Popover>
    </MenuNestingContext.Provider>
  );
};
