import React, { useState } from "react";
import { find, noop } from "lodash";
import { DropdownOption } from "components/constants";
import { StyledDropDownContainer } from "components/propertyControls/StyledControls";
import { StyledMenu } from "components/ads/TreeDropdown";
import {
  Button as BlueprintButton,
  PopoverInteractionKind,
  PopoverPosition,
  IPopoverSharedProps,
  Popover,
  Classes,
  Position,
  MenuItem,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { entityTooltipCSS } from "./Entity";
import { useCloseMenuOnScroll } from "./hooks";
import { SIDEBAR_ID } from "constants/Explorer";

export type TreeDropdownOption = DropdownOption & {
  onSelect?: (value: TreeDropdownOption, setter?: Setter) => void;
  children?: TreeDropdownOption[];
  className?: string;
  type?: string;
  confirmDelete?: boolean;
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
  setConfirmDelete?: (val: boolean) => void;
  onMenuToggle?: (isOpen: boolean) => void;
  position?: Position;
  icon?: React.ReactNode;
  editorPage?: boolean;
  menuWidth?: number;
};

export const StyledPopover = styled(Popover)`
  .${Classes.POPOVER_TARGET} {
    ${entityTooltipCSS}
  }
  div {
    flex: 1 1 auto;
  }
  span {
    width: 100%;
    position: relative;
  }
  .${Classes.BUTTON} {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
  }
  .${Classes.BUTTON_TEXT} {
    text-overflow: ellipsis;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
  && {
    .${Classes.ICON} {
      width: fit-content;
      color: ${Colors.SLATE_GRAY};
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
    defaultText,
    displayValue,
    getDefaults,
    menuWidth,
    onSelect,
    optionTree,
    selectedLabelModifier,
    selectedValue,
    setConfirmDelete,
    toggle,
  } = props;
  const selectedOption = getSelectedOption(
    selectedValue,
    defaultText,
    optionTree,
  );

  const [isOpen, setIsOpen] = useState<boolean>(false);
  useCloseMenuOnScroll(SIDEBAR_ID, isOpen, () => setIsOpen(false));

  const handleSelect = (option: TreeDropdownOption) => {
    if (option.onSelect) {
      option.onSelect(option, props.onSelect);
      if (option.value === "delete" && !option.confirmDelete) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
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
        label={option.subText}
        onClick={
          option.children
            ? noop
            : (e: any) => {
                handleSelect(option);
                e.stopPropagation();
              }
        }
        popoverProps={{
          minimal: true,
          interactionKind: PopoverInteractionKind.CLICK,
          position: PopoverPosition.RIGHT,
          targetProps: { onClick: (e: any) => e.stopPropagation() },
        }}
        text={option.label}
      >
        {option.children && option.children.map(renderTreeOption)}
      </MenuItem>
    );
  }

  const list = optionTree.map(renderTreeOption);
  const menuItems = (
    <StyledMenu className="t--entity-context-menu" width={menuWidth}>
      {list}
    </StyledMenu>
  );
  const defaultToggle = (
    <StyledDropDownContainer>
      <BlueprintButton
        className={`t--open-dropdown-${defaultText.split(" ").join("-")} ${
          selectedLabelModifier ? "code-highlight" : ""
        }`}
        rightIcon={IconNames.CHEVRON_DOWN}
        text={
          selectedLabelModifier
            ? selectedLabelModifier(selectedOption, displayValue)
            : selectedOption.label
        }
      />
    </StyledDropDownContainer>
  );
  return (
    <StyledPopover
      boundary="viewport"
      canEscapeKeyClose
      className={props.className}
      content={menuItems}
      isOpen={isOpen}
      minimal
      modifiers={props.modifiers}
      onClose={() => {
        setIsOpen(false);
        setConfirmDelete ? setConfirmDelete(false) : null;
      }}
      position={props.position || PopoverPosition.RIGHT_TOP}
      targetProps={{
        onClick: (e: any) => {
          setIsOpen(true);
          e.stopPropagation();
        },
      }}
    >
      {toggle ? toggle : defaultToggle}
    </StyledPopover>
  );
}
