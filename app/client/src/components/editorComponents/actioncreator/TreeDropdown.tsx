import React from "react";
import { find } from "lodash";
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
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

export type TreeDropdownOption = DropdownOption & {
  onSelect?: (value: TreeDropdownOption, setter?: Function) => void;
  children?: TreeDropdownOption[];
  className?: string;
  type?: string;
};

type TreeDropdownProps = {
  optionTree: TreeDropdownOption[];
  selectedValue: string;
  getDefaults?: Function;
  defaultText: string;
  onSelect: (value: TreeDropdownOption, defaultVal?: string) => void;
  selectedLabelModifier?: (
    option: TreeDropdownOption,
    displayValue?: string,
  ) => React.ReactNode;
  displayValue?: string;
  toggle?: React.ReactNode;
  className?: string;
};

function getSelectedOption(
  selectedValue: string,
  defaultText: string,
  options: TreeDropdownOption[],
) {
  let selectedOption = {
    label: defaultText,
    value: "",
  };
  options.length > 0 &&
    options.forEach(option => {
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

  const handleSelect = (option: TreeDropdownOption) => {
    if (option.onSelect) {
      option.onSelect(option, props.onSelect);
    } else {
      const defaultVal = getDefaults ? getDefaults(option.value) : undefined;
      onSelect(option, defaultVal);
    }
  };

  function renderTreeOption(option: TreeDropdownOption) {
    const isSelected = selectedOption.value === option.value;
    return (
      <StyledMenuItem
        className={option.className || "single-select"}
        active={isSelected}
        key={option.value}
        icon={option.id === "create" ? "plus" : undefined}
        onClick={(e: any) => {
          e.stopPropagation();
          if (option.children) handleSelect(option);
        }}
        text={option.label}
        intent={option.intent}
        popoverProps={{
          minimal: true,
          interactionKind: PopoverInteractionKind.CLICK,
          position: PopoverPosition.RIGHT,
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
      usePortal={true}
      minimal={true}
      content={menuItems}
      position={PopoverPosition.AUTO_END}
      className={props.className}
    >
      {toggle ? toggle : defaultToggle}
    </StyledPopover>
  );
}
