import React, { useState } from "react";
import { find, noop } from "lodash";
import { DropdownOption } from "widgets/DropdownWidget";
import {
  StyledPopover,
  StyledDropDownContainer,
  StyledMenuItem,
  StyledMenu,
} from "components/propertyControls/StyledControls";
import {
  Button as BlueprintButton,
  PopoverInteractionKind,
  PopoverPosition,
  IPopoverSharedProps,
} from "@blueprintjs/core";
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
};

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
      <StyledMenuItem
        className={option.className || "single-select"}
        active={isSelected}
        key={option.value}
        icon={option.id === "create" ? "plus" : undefined}
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
          position: PopoverPosition.RIGHT,
          targetProps: { onClick: (e: any) => e.stopPropagation() },
        }}
      >
        {option.children && option.children.map(renderTreeOption)}
      </StyledMenuItem>
    );
  }

  const list = optionTree.map(renderTreeOption);
  const menuItems = <StyledMenu>{list}</StyledMenu>;
  const defaultToggle = (
    <StyledDropDownContainer>
      <BlueprintButton
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
    </StyledDropDownContainer>
  );
  return (
    <StyledPopover
      isOpen={isOpen}
      minimal
      content={menuItems}
      position={PopoverPosition.AUTO_END}
      className={props.className}
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
      {toggle ? toggle : defaultToggle}
    </StyledPopover>
  );
}
