import React, { useState } from "react";
import { find, noop } from "lodash";
import { DropdownOption } from "widgets/DropdownWidget";
import {
  PopoverInteractionKind,
  PopoverPosition,
  IPopoverSharedProps,
  MenuItem,
  Popover,
  Menu,
  Button,
  Classes,
} from "@blueprintjs/core";
import styled from "styled-components";
import { IconNames } from "@blueprintjs/icons";

export type TreeDropdownOption = DropdownOption & {
  onSelect?: (value: TreeDropdownOption, setter?: Setter) => void;
  children?: TreeDropdownOption[];
  className?: string;
  type?: string;
};

type Setter = (value: TreeDropdownOption, defaultVal?: string) => void;

type TreeDropdownProps = {
  optionTree: TreeDropdownOption[];
  selectedValue: string;
  getDefaults?: (value: any) => any;
  defaultText: string;
  onSelect: Setter;
  selectedLabelModifier?: (
    option: TreeDropdownOption,
    displayValue?: string,
  ) => React.ReactNode;
  displayValue?: string;
  toggle?: React.ReactNode;
  className?: string;
  modifiers?: IPopoverSharedProps["modifiers"];
  onMenuToggle?: (isOpen: boolean) => void;
};

const StyledMenu = styled(Menu)`
  min-width: 220px;
  padding: 0px;
  border-radius: 0px;
  background-color: ${(props) => props.theme.colors.treeDropdown.menuBg.normal};
  box-shadow: ${(props) => props.theme.colors.treeDropdown.menuShadow};
  .${Classes.MENU} {
    min-width: 220px;
    padding: 0px;
    border-radius: 0px;
    background-color: ${(props) =>
      props.theme.colors.treeDropdown.menuBg.normal};
  }
  .${Classes.MENU_ITEM} {
    border-radius: 0px;
    font-size: 12px;
    line-height: 14px;
    display: flex;
    align-items: center;
    height: 30px;
    color: ${(props) => props.theme.colors.treeDropdown.menuText.normal};
    .${Classes.ICON} > svg:not([fill]) {
      margin-top: 0px;
      fill: #9f9f9f;
    }

    &:hover {
      background-color: ${(props) =>
        props.theme.colors.treeDropdown.menuBg.hover};
      color: ${(props) => props.theme.colors.treeDropdown.menuText.hover};
      .${Classes.ICON} > svg:not([fill]) {
        fill: ${(props) => props.theme.colors.treeDropdown.menuText.hover};
      }
    }

    &.${Classes.ACTIVE} {
      background-color: ${(props) =>
        props.theme.colors.treeDropdown.menuBg.selected};
      color: ${(props) => props.theme.colors.treeDropdown.menuText.selected};
      .${Classes.ICON} > svg:not([fill]) {
        fill: ${(props) => props.theme.colors.treeDropdown.menuText.selected};
      }
    }
  }
  .${Classes.MENU_SUBMENU}
    .${Classes.POPOVER_TARGET}.${Classes.POPOVER_OPEN}
    > .${Classes.MENU_ITEM} {
    background-color: ${(props) =>
      props.theme.colors.treeDropdown.menuBg.hover};
    color: ${(props) => props.theme.colors.treeDropdown.menuText.hover};
  }
`;

const DropdownTarget = styled.div`
  &&&& .${Classes.BUTTON} {
    width: 100%;
    box-shadow: none;
    border-radius: 0px;
    background-color: ${(props) => props.theme.colors.treeDropdown.targetBg};
    color: ${(props) => props.theme.colors.treeDropdown.menuText.normal};
    background-image: none;
    display: flex;
    justify-content: space-between;
    padding: 5px 12px;
  }
  &&&& .${Classes.ICON} {
    color: ${(props) => props.theme.colors.treeDropdown.menuText.normal};
  }
`;

function getSelectedOption(
  selectedValue: string,
  defaultText: string,
  options: TreeDropdownOption[],
) {
  let selectedOption: TreeDropdownOption = {
    label: defaultText,
    value: "",
  };
  options.length > 0 &&
    options.forEach((option) => {
      // Find the selected option in the OptionsTree
      if (option.value === selectedValue) {
        selectedOption = option;
      } else {
        const childOption = find(option.children, {
          value: selectedValue,
        });
        if (childOption) {
          selectedOption = childOption;
        }
      }
    });
  return selectedOption;
}

export default function TreeDropdown(props: TreeDropdownProps) {
  const {
    selectedValue,
    defaultText,
    optionTree,
    onSelect,
    getDefaults,
    selectedLabelModifier,
    displayValue,
    toggle,
  } = props;
  const selectedOption = getSelectedOption(
    selectedValue,
    defaultText,
    optionTree,
  );

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleSelect = (option: TreeDropdownOption) => {
    if (option.onSelect) {
      option.onSelect(option, props.onSelect);
    } else {
      const defaultVal = getDefaults ? getDefaults(option.value) : undefined;
      onSelect(option, defaultVal);
    }
  };

  function renderTreeOption(option: TreeDropdownOption) {
    const isSelected =
      selectedOption.value === option.value ||
      selectedOption.type === option.value;
    return (
      <MenuItem
        className={option.className || "single-select"}
        active={isSelected}
        key={option.value}
        icon={option.icon}
        onClick={
          option.children
            ? noop
            : (e: any) => {
                handleSelect(option);
                setIsOpen(false);
                props.onMenuToggle && props.onMenuToggle(false);
                e.stopPropagation();
              }
        }
        text={option.label}
        intent={option.intent}
        popoverProps={{
          minimal: true,
          interactionKind: PopoverInteractionKind.CLICK,
          position: PopoverPosition.LEFT,
          targetProps: { onClick: (e: any) => e.stopPropagation() },
        }}
      >
        {option.children && option.children.map(renderTreeOption)}
      </MenuItem>
    );
  }

  const list = optionTree.map(renderTreeOption);
  const menuItems = <StyledMenu>{list}</StyledMenu>;
  const defaultToggle = (
    <DropdownTarget>
      <Button
        rightIcon={IconNames.CHEVRON_DOWN}
        text={
          selectedLabelModifier
            ? selectedLabelModifier(selectedOption, displayValue)
            : selectedOption.label
        }
        className={`t--open-dropdown-${defaultText.split(" ").join("-")} ${
          selectedLabelModifier ? "code-highlight" : ""
        }`}
      />
    </DropdownTarget>
  );
  return (
    <Popover
      isOpen={isOpen}
      minimal
      content={menuItems}
      position={PopoverPosition.LEFT}
      className="wrapper-popover"
      modifiers={props.modifiers}
      onClose={() => {
        setIsOpen(false);
        props.onMenuToggle && props.onMenuToggle(false);
      }}
      targetProps={{
        onClick: (e: any) => {
          setIsOpen(true);
          props.onMenuToggle && props.onMenuToggle(true);
          e.stopPropagation();
        },
      }}
    >
      {toggle ? toggle : defaultToggle}
    </Popover>
  );
}
