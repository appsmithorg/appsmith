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
} from "@blueprintjs/core";
import styled from "styled-components";
import Icon, { IconSize } from "./Icon";

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
};

const MoreActionableContainer = styled.div<{ isOpen: boolean }>`
  width: 34px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;

  &&&& span {
    width: auto;
  }

  &&&& svg > path {
    fill: ${(props) =>
      props.theme.colors.apiPane.moreActions.targetIcon.normal};
  }

  ${(props) =>
    props.isOpen
      ? `
		background-color: ${props.theme.colors.apiPane.moreActions.targetBg};

    &&&& svg > path {
      fill: ${props.theme.colors.apiPane.moreActions.targetIcon.hover};
    }
	`
      : null}

  &:hover {
    background-color: ${(props) =>
      props.theme.colors.apiPane.moreActions.targetBg};

    &&&& svg > path {
      fill: ${(props) =>
        props.theme.colors.apiPane.moreActions.targetIcon.hover};
    }
  }
`;

const StyledPopover = styled.div`
  .bp3-transition-container {
    top: 4px !important;
  }

  .bp3-popover {
    border-radius: 0px;
    box-shadow: ${(props) => props.theme.colors.apiPane.moreActions.menuShadow};

    .bp3-popover-content {
      border-radius: 0px;
    }

    &&& ul {
      background-color: ${(props) =>
        props.theme.colors.apiPane.moreActions.menuBg.normal};
    }

    .bp3-menu {
      min-width: 220px;
      padding: 0px;
      border-radius: 0px;
      background-color: ${(props) =>
        props.theme.colors.apiPane.moreActions.menuBg.normal};

      .bp3-menu-item {
        font-size: 14px;
        line-height: 20px;
        letter-spacing: -0.24px;
        padding: 10px 15px;
        color: ${(props) =>
          props.theme.colors.apiPane.moreActions.menuText.normal};
        .bp3-icon > svg:not([fill]) {
          fill: #9f9f9f;
        }

        &:active,
        &:hover {
          background-color: ${(props) =>
            props.theme.colors.apiPane.moreActions.menuBg.hover};
          color: ${(props) =>
            props.theme.colors.apiPane.moreActions.menuText.hover};
        }
      }
      .bp3-submenu .bp3-popover-target.bp3-popover-open > .bp3-menu-item {
        background-color: ${(props) =>
          props.theme.colors.apiPane.moreActions.menuBg.hover};
        color: ${(props) =>
          props.theme.colors.apiPane.moreActions.menuText.hover};
      }
    }
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
  const menuItems = <Menu>{list}</Menu>;
  const defaultToggle = (
    <MoreActionableContainer isOpen={isOpen} className={props.className}>
      <Icon name="context-menu" size={IconSize.XXXL} />
    </MoreActionableContainer>
  );
  return (
    <StyledPopover>
      <Popover
        usePortal={false}
        isOpen={isOpen}
        minimal
        content={menuItems}
        position={PopoverPosition.LEFT}
        className="wrapper-popover"
        modifiers={props.modifiers}
        onClose={() => {
          setIsOpen(false);
        }}
        targetProps={{
          onClick: (e: any) => {
            setIsOpen(true);
            e.stopPropagation();
          },
        }}
      >
        {defaultToggle}
      </Popover>
    </StyledPopover>
  );
}
