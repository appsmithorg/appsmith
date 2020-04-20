import React from "react";
import _ from "lodash";
import { DropdownOption } from "widgets/DropdownWidget";
import {
  StyledPopover,
  StyledDropDownContainer,
  StyledMenuItem,
} from "components/propertyControls/StyledControls";
import {
  Button as BlueprintButton,
  Menu,
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
  selectedLabelModifier?: (option: TreeDropdownOption) => string;
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
        const childOption = _.find(option.children, {
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
        onClick={option.children ? _.noop : () => handleSelect(option)}
        text={option.label}
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
  const menuItems = <Menu>{list}</Menu>;
  return (
    <StyledDropDownContainer>
      <StyledPopover usePortal={true} minimal={true} content={menuItems}>
        <BlueprintButton
          rightIcon={IconNames.CHEVRON_DOWN}
          text={
            selectedLabelModifier
              ? selectedLabelModifier(selectedOption)
              : selectedOption.label
          }
          className={`t--open-dropdown-${defaultText.split(" ").join("-")}`}
        />
      </StyledPopover>
    </StyledDropDownContainer>
  );
}
