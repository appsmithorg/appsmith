import React, { useState } from "react";
import { find, noop } from "lodash";
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
import { Colors } from "constants/Colors";
import { DropdownOption } from "components/constants";
import Icon, { IconSize } from "components/ads/Icon";
import { replayHighlightClass } from "globalStyles/portals";

export type TreeDropdownOption = DropdownOption & {
  onSelect?: (value: TreeDropdownOption, setter?: Setter) => void;
  children?: TreeDropdownOption[];
  className?: string;
  type?: string;
  icon?: React.ReactNode;
  args?: Array<any>;
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
  max-height: ${(props) =>
    `calc(100vh - ${props.theme.smallHeaderHeight} - ${props.theme.bottomBarHeight})`};
  overflow: auto;
  min-width: 220px;
  padding: 0px;
  border-radius: 0px;
  background-color: ${(props) => props.theme.colors.treeDropdown.menuBg.normal};
  .${Classes.MENU} {
    min-width: 220px;
    padding: 0px;
    border-radius: 0px;
    background-color: ${(props) =>
      props.theme.colors.treeDropdown.menuBg.normal};
  }
  .${Classes.MENU_ITEM} {
    border-radius: 0px;
    font-size: 14px;
    line-height: ${(props) => props.theme.typography.p1.lineHeight}px;
    display: flex;
    align-items: center;
    height: 30px;
    color: ${(props) => props.theme.colors.treeDropdown.menuText.normal};
    .${Classes.ICON} > svg:not([fill]) {
      margin-top: 0px;
      fill: #9f9f9f;
    }

    &.t--apiFormDeleteBtn,
    &.t--apiFormDeleteBtn:hover {
      color: ${Colors.DANGER_SOLID};
      .${Classes.ICON} svg {
        fill: ${Colors.DANGER_SOLID};
      }
    }

    &:hover {
      background-color: ${Colors.GREY_3};
      color: ${Colors.GREY_10};
      .${Classes.ICON} > svg:not([fill]) {
        fill: ${Colors.GREY_10};
      }
    }

    &.${Classes.ACTIVE} {
      background-color: ${Colors.GREY_3};
      color: ${(props) => props.theme.colors.treeDropdown.menuText.selected};
      .${Classes.ICON} > svg:not([fill]) {
        fill: ${(props) => props.theme.colors.treeDropdown.menuText.selected};
      }
    }
  }
  .${Classes.MENU_SUBMENU}
    .${Classes.POPOVER_TARGET}.${Classes.POPOVER_OPEN}
    > .${Classes.MENU_ITEM} {
    background-color: ${Colors.GREY_3};
  }
`;

const DropdownTarget = styled.div`
  &&&& .${Classes.BUTTON} {
    width: 100%;
    box-shadow: none;
    border-radius: 0px;
    border: 1px solid ${Colors.GREY_5};
    min-height: 36px;
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
    defaultText,
    displayValue,
    getDefaults,
    onSelect,
    optionTree,
    selectedLabelModifier,
    selectedValue,
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
        active={isSelected}
        className={option.className || "single-select"}
        icon={option.icon}
        intent={option.intent}
        key={option.value}
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
        popoverProps={{
          minimal: true,
          interactionKind: PopoverInteractionKind.CLICK,
          position: PopoverPosition.RIGHT_TOP,
          targetProps: { onClick: (e: any) => e.stopPropagation() },
        }}
        text={option.label}
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
        className={`t--open-dropdown-${defaultText.split(" ").join("-")} ${
          selectedLabelModifier
            ? "code-highlight " + replayHighlightClass
            : replayHighlightClass
        }`}
        rightIcon={<Icon name="downArrow" size={IconSize.XXL} />}
        text={
          selectedLabelModifier
            ? selectedLabelModifier(selectedOption, displayValue)
            : selectedOption.label
        }
      />
    </DropdownTarget>
  );
  return (
    <Popover
      className="wrapper-popover"
      content={menuItems}
      isOpen={isOpen}
      minimal
      modifiers={props.modifiers}
      onClose={() => {
        setIsOpen(false);
        props.onMenuToggle && props.onMenuToggle(false);
      }}
      position={PopoverPosition.LEFT}
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
