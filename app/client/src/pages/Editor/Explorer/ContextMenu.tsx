import React, { useState } from "react";
import {
  Menu,
  MenuTrigger,
  MenuItem,
  MenuContent,
  Button,
} from "design-system";
import { EntityClassNames } from "./Entity";

export type TreeDropdownOption = {
  label: string;
  value: string;
  className?: string;
  onSelect?: (value: TreeDropdownOption, setter?: Setter) => void;
  confirmDelete?: boolean;
  intent?: string;
};
type Setter = (value: TreeDropdownOption, defaultVal?: string) => void;

type TreeDropdownProps = {
  toggle?: React.ReactNode;
  optionTree: TreeDropdownOption[];
  className?: string;
  setConfirmDelete?: (val: boolean) => void;
};

export default function TreeDropdown(props: TreeDropdownProps) {
  const { optionTree } = props;
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSelect = (option: TreeDropdownOption) => {
    if (option.onSelect) {
      option.onSelect(option);
      if (option.value === "delete" && !option.confirmDelete) {
        handleOpenChange(true);
      } else {
        handleOpenChange(false);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // handle open
    } else {
      // handle close
      props.setConfirmDelete && props.setConfirmDelete(false);
    }

    setIsOpen(open);
  };

  function renderTreeOption(option: TreeDropdownOption) {
    return (
      <MenuItem
        className={option.className}
        onClick={() => handleSelect(option)}
      >
        {option.label}
      </MenuItem>
    );
  }
  const list = optionTree.map(renderTreeOption);
  const menuItems = (
    <MenuContent
      align="start"
      className={`t--entity-context-menu ${EntityClassNames.CONTEXT_MENU_CONTENT}`}
      onInteractOutside={() => handleOpenChange(false)}
      side="right"
      width="220px"
    >
      {list}
    </MenuContent>
  );

  return (
    <Menu open={isOpen}>
      <MenuTrigger onClick={() => handleOpenChange(!isOpen)}>
        <Button
          className={props.className}
          isIconButton
          kind="tertiary"
          startIcon="more-vertical-control"
          type="button"
        />
      </MenuTrigger>
      {menuItems}
    </Menu>
  );
}
