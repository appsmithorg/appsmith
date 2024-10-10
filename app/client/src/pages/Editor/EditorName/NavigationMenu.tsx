import React, { useCallback } from "react";

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
  const handleInteractionOutside = useCallback(() => {
    setIsPopoverOpen(false);
  }, [setIsPopoverOpen]);

  return (
    <MenuContent onInteractOutside={handleInteractionOutside} width="214px">
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
