import React from "react";

import type { noop } from "lodash";

import type { MenuItemData } from "./NavigationMenuItem";
import { MenuContent } from "@appsmith/ads";
import { NavigationMenuItem } from "./NavigationMenuItem";

interface NavigationMenuProps {
  menuItems: MenuItemData[] | undefined;
  setIsPopoverOpen: typeof noop;
}

export function NavigationMenu(props: NavigationMenuProps) {
  const { menuItems, setIsPopoverOpen } = props;
  return (
    <MenuContent
      width="214px"
      onInteractOutside={() => {
        setIsPopoverOpen(false);
      }}
    >
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
