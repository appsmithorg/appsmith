import React from "react";

import type { noop } from "lodash";

import type { MenuItemData } from "./NavigationMenuItem";
import { MenuContent } from "design-system";
import { NavigationMenuItem } from "./NavigationMenuItem";

type NavigationMenuProps = {
  menuItems: MenuItemData[] | undefined;
  setIsPopoverOpen: typeof noop;
};

export function NavigationMenu(props: NavigationMenuProps) {
  const { menuItems, setIsPopoverOpen } = props;
  return (
    <MenuContent width="214px">
      {menuItems?.map((item, idx) => {
        return (
          <NavigationMenuItem
            key={idx}
            menuItemData={item}
            setIsPopoverOpen={setIsPopoverOpen}
          />
        );
      })}
    </MenuContent>
  );
}
