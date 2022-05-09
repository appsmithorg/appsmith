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

function Select(props: Props) {
  const menus =
    (Array.isArray(props.children) &&
      props.children.find(
        (child: any) => child.type.displayName === "SelectList",
      )) ||
    undefined;

  const trigger =
    Array.isArray(props.children) &&
    props.children.find(
      (child: any) => child.type.displayName === "SelectTrigger",
    );

  return (
    <Popover
      content={menus}
      popoverClassName="Select-v2"
      transitionDuration={-1}
    >
      {trigger}
    </Popover>
  );
}

function SelectList(props: IMenuProps) {
  return <Menu {...props} />;
}

SelectList.displayName = "SelectList";

function SelectTrigger(props: any) {
  return <div {...props} />;
}

SelectTrigger.displayName = "SelectTrigger";

function SelectOption(props: IMenuItemProps) {
  return <MenuItem {...props} />;
}

SelectOption.displayName = "SelectOption";

export { Select, SelectList, SelectOption, SelectTrigger };
