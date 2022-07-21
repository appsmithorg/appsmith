import React from "react";
import styled from "styled-components";
import {
  Popover,
  Menu,
  MenuItem,
  IMenuProps,
  IMenuItemProps,
  IPopoverProps,
} from "@blueprintjs/core";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 *-----------------------------------------------------------------------------
 */

type Props = {
  children: React.ReactElement[] | React.ReactElement;
};

/**
 * ----------------------------------------------------------------------------
 * STYLED
 *-----------------------------------------------------------------------------
 */

const StyledMenuItem = styled(MenuItem)`
  margin: 0;
  padding: 8px;
`;

const StyledMenu = styled(Menu)`
  margin: 0;
  padding: 0;
`;

/**
 * ----------------------------------------------------------------------------
 * COMPONENTS
 *-----------------------------------------------------------------------------
 */
function Dropdown(props: IPopoverProps & Props) {
  const { children, ...rest } = props;

  const menus =
    (Array.isArray(children) &&
      children.find(
        (child: any) => child.type.displayName === "DropdownList",
      )) ||
    undefined;

  const trigger =
    Array.isArray(children) &&
    children.find((child: any) => child.type.displayName === "DropdownTrigger");

  return (
    <Popover
      {...rest}
      content={menus}
      popoverClassName="dropdown-v2"
      transitionDuration={-1}
    >
      {trigger}
    </Popover>
  );
}

function DropdownList(props: IMenuProps) {
  return <StyledMenu {...props} />;
}

DropdownList.displayName = "DropdownList";

function DropdownTrigger(props: any) {
  return <div {...props} />;
}

DropdownTrigger.displayName = "DropdownTrigger";

function DropdownItem(props: IMenuItemProps) {
  return <StyledMenuItem {...props} />;
}

DropdownItem.displayName = "DropdownItem";

export { Dropdown, DropdownList, DropdownItem, DropdownTrigger };
