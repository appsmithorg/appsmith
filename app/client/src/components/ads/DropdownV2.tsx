import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuListProps,
  MenuProps,
  MenuButtonProps,
  MenuItemProps,
} from "@chakra-ui/react";
import React from "react";
import { Colors } from "constants/Colors";

function Dropdown(props: MenuProps) {
  return <Menu {...props} />;
}

function DropdownButton(props: MenuButtonProps) {
  return <MenuButton {...props} />;
}

function DropdownList(props: MenuListProps) {
  return <MenuList p={0} rounded={0} {...props} />;
}

function DropdownItem(props: MenuItemProps) {
  return (
    <MenuItem
      _hover={{
        background: Colors.GREY_2,
      }}
      {...props}
    />
  );
}

export { DropdownList, Dropdown, DropdownButton, DropdownItem };
