import React from "react";

import { noop } from "lodash";

import {
  NavigationMenuItem,
  MenuTypes,
  MenuItemData,
} from "./NavigationMenuItem";

type NavigationMenuProps = {
  menuItems: MenuItemData[] | undefined;
  setIsPopoverOpen: typeof noop;
};

export function NavigationMenu(props: NavigationMenuProps) {
  const { menuItems, setIsPopoverOpen } = props;

  return (
    // eslint-disable-next-line
    <>
      {menuItems?.map((item, idx) => {
        return item.type === MenuTypes.PARENT ? (
          <NavigationMenuItem
            key={idx}
            menuItemData={item}
            setIsPopoverOpen={setIsPopoverOpen}
          >
            <NavigationMenu
              menuItems={item?.children}
              setIsPopoverOpen={setIsPopoverOpen}
            />
          </NavigationMenuItem>
        ) : (
          <NavigationMenuItem
            key={idx}
            menuItemData={item}
            setIsPopoverOpen={setIsPopoverOpen}
          />
        );
      })}
    </>
  );
}
