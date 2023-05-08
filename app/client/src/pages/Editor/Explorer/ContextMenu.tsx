import React, { useState } from "react";
import {
  Menu,
  MenuTrigger,
  MenuItem,
  MenuContent,
  Button,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
} from "design-system";
import { EntityClassNames } from "./Entity";

export type TreeDropdownOption = {
  label: string;
  value: string;
  children?: TreeDropdownOption[];
  className?: string;
  onSelect?: (value: TreeDropdownOption, setter?: Setter) => void;
  confirmDelete?: boolean;
  intent?: string;
  disabled?: boolean;
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
      // MenuTrigger takes focus after the Menu closes. For an input to be focused for e.g
      // edit name we have to take focus back from it.
      // Without this the input takes focus first post which the Menu closes post which MenuTrigger
      // takes back focus.
      setTimeout(() => {
        option.onSelect && option.onSelect(option);
      }, 0);
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
    if (option.children) {
      return (
        <MenuSub>
          <MenuSubTrigger>{option.label}</MenuSubTrigger>
          <MenuSubContent width="220px">
            {option.children.map(renderTreeOption)}
          </MenuSubContent>
        </MenuSub>
      );
    }

    return (
      <MenuItem
        className={`${option.intent === "danger" ? "error-menuitem" : ""} ${
          option.className
        }`}
        disabled={option.disabled}
        onClick={(e) => {
          handleSelect(option);
          e.stopPropagation();
        }}
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
      <MenuTrigger
        className="t--context-menu"
        onClick={() => handleOpenChange(!isOpen)}
      >
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
