import React from "react";
import {
  Popover,
  Menu as BMenu,
  MenuItem as BMenuItem,
  IMenuProps,
  IMenuItemProps,
} from "@blueprintjs/core";

type Props = {
  children: React.ReactElement[] | React.ReactElement;
};

function Menu(props: Props) {
  const menus =
    (Array.isArray(props.children) &&
      props.children.find(
        (child: any) => child.type.displayName === "MenuList",
      )) ||
    undefined;

  const trigger =
    Array.isArray(props.children) &&
    props.children.find(
      (child: any) => child.type.displayName === "MenuTrigger",
    );

  return (
    <Popover content={menus} popoverClassName="Menu-v2" transitionDuration={-1}>
      {trigger}
    </Popover>
  );
}

function MenuList(props: IMenuProps) {
  return <BMenu {...props} />;
}

MenuList.displayName = "MenuList";

function MenuTrigger(props: any) {
  return <div {...props} />;
}

MenuTrigger.displayName = "MenuTrigger";

function MenuItem(props: IMenuItemProps) {
  return <BMenuItem {...props} />;
}

MenuItem.displayName = "MenuItem";

export { Menu, MenuList, MenuItem, MenuTrigger };
