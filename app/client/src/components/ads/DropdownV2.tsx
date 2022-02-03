import React from "react";
import {
  Popover,
  Menu,
  MenuItem,
  IMenuProps,
  IMenuItemProps,
} from "@blueprintjs/core";

type Props = {
  children: React.ReactElement[] | React.ReactElement;
};

function Dropdown(props: Props) {
  const menus =
    (Array.isArray(props.children) &&
      props.children.find(
        (child: any) => child.type.displayName === "DropdownList",
      )) ||
    undefined;

  const trigger =
    Array.isArray(props.children) &&
    props.children.find(
      (child: any) => child.type.displayName === "DropdownTrigger",
    );

  return (
    <Popover
      content={menus}
      popoverClassName="dropdown-v2"
      transitionDuration={-1}
    >
      {trigger}
    </Popover>
  );
}

function DropdownList(props: IMenuProps) {
  return <Menu {...props} />;
}

DropdownList.displayName = "DropdownList";

function DropdownTrigger(props: any) {
  return <div {...props} />;
}

DropdownTrigger.displayName = "DropdownTrigger";

function DropdownItem(props: IMenuItemProps) {
  return <MenuItem {...props} />;
}

DropdownItem.displayName = "DropdownItem";

export { Dropdown, DropdownList, DropdownItem, DropdownTrigger };
