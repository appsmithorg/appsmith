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
  Tooltip,
  MenuSeparator,
} from "@appsmith/ads";
import {
  createMessage,
  ENTITY_MORE_ACTIONS_TOOLTIP,
} from "ee/constants/messages";
import { AddButtonWrapper, EntityClassNames } from "./Entity";
import styled from "styled-components";

export interface TreeDropdownOption {
  label: React.ReactNode;
  value: string;
  children?: TreeDropdownOption[];
  className?: string;
  onSelect?: (value: TreeDropdownOption, setter?: Setter) => void;
  confirmDelete?: boolean;
  intent?: string;
  disabled?: boolean;
  type?: "menu-item" | "menu-divider";
  tooltipText?: string;
}
type Setter = (value: TreeDropdownOption, defaultVal?: string) => void;

interface TreeDropdownProps {
  toggle?: React.ReactNode;
  optionTree: TreeDropdownOption[];
  className?: string;
  triggerId?: string;
  setConfirmDelete?: (val: boolean) => void;
}

const StyledMenuSubContent = styled(MenuSubContent)`
  max-height: 350px;
`;

export default function TreeDropdown(props: TreeDropdownProps) {
  const { optionTree } = props;
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSelect = (option: TreeDropdownOption) => {
    if (option.onSelect) {
      // MenuTrigger takes focus after the Menu closes. For an input to be focused for e.g
      // Rename we have to take focus back from it.
      // Without this the input takes focus first post which the Menu closes post which MenuTrigger
      // takes back focus.
      setTimeout(() => {
        option.onSelect?.(option);
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
        <MenuSub key={option.value}>
          <MenuSubTrigger>{option.label}</MenuSubTrigger>
          <StyledMenuSubContent width="220px">
            {option.children.map(renderTreeOption)}
          </StyledMenuSubContent>
        </MenuSub>
      );
    }

    if (option.type === "menu-divider") {
      return <MenuSeparator />;
    }

    return (
      <Tooltip
        content={option.tooltipText}
        isDisabled={!option.tooltipText}
        key={option.value}
        placement="top"
      >
        <MenuItem
          className={`${option.intent === "danger" ? "error-menuitem" : ""} ${
            option.className
          }`}
          disabled={option.disabled}
          key={option.value}
          onClick={(e) => {
            handleSelect(option);
            e.stopPropagation();
          }}
        >
          {option.label}
        </MenuItem>
      </Tooltip>
    );
  }

  const list = optionTree.map(renderTreeOption);
  const menuItems = (
    <MenuContent
      align="start"
      className={`t--entity-context-menu ${EntityClassNames.CONTEXT_MENU_CONTENT}`}
      onInteractOutside={() => handleOpenChange(false)}
      side="right"
      style={{ maxHeight: "unset" }}
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
        <AddButtonWrapper>
          <Tooltip
            content={createMessage(ENTITY_MORE_ACTIONS_TOOLTIP)}
            isDisabled={isOpen}
            mouseLeaveDelay={0}
            placement="right"
          >
            <Button
              className={props.className}
              id={props.triggerId}
              isIconButton
              kind="tertiary"
              startIcon="more-vertical-control"
              type="button"
            />
          </Tooltip>
        </AddButtonWrapper>
      </MenuTrigger>
      {menuItems}
    </Menu>
  );
}
