import React from "react";
import _ from "lodash";
import { DropdownOption } from "widgets/DropdownWidget";
import {
  StyledDropDown,
  StyledDropDownContainer,
} from "components/propertyControls/StyledControls";
import {
  Button,
  MenuItem,
  PopoverInteractionKind,
  PopoverPosition,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

type ActionTypeDropdownProps = {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
};

class StyledDropdown extends React.Component<ActionTypeDropdownProps> {
  handleSelect = (option: DropdownOption) => {
    this.props.onSelect(option.value);
  };
  renderItem = (option: DropdownOption) => {
    const isSelected = this.isOptionSelected(option);
    return (
      <MenuItem
        className="single-select"
        active={isSelected}
        key={option.value}
        onClick={() => this.handleSelect(option)}
        text={option.label}
        popoverProps={{
          minimal: true,
          hoverCloseDelay: 0,
          interactionKind: PopoverInteractionKind.HOVER,
          position: PopoverPosition.BOTTOM,
          modifiers: {
            arrow: {
              enabled: false,
            },
            offset: {
              enabled: true,
              offset: "-16px, 0",
            },
          },
        }}
      >
        {option.children && option.children.map(this.renderItem)}
      </MenuItem>
    );
  };
  isOptionSelected = (currentOption: DropdownOption) => {
    if (currentOption.children) {
      return _.some(currentOption.children, {
        value: this.props.selectedValue,
      });
    } else {
      return currentOption.value === this.props.selectedValue;
    }
  };

  render() {
    const { selectedValue } = this.props;
    let selectedOption = this.props.options[0];
    this.props.options.forEach(o => {
      if (o.value === selectedValue) {
        selectedOption = o;
      } else {
        const childOption = _.find(o.children, {
          value: this.props.selectedValue,
        });
        if (childOption) selectedOption = childOption;
      }
    });
    return (
      <StyledDropDownContainer>
        <StyledDropDown
          filterable={false}
          items={this.props.options}
          itemRenderer={this.renderItem}
          onItemSelect={_.noop}
          popoverProps={{
            minimal: true,
            usePortal: false,
            position: PopoverPosition.BOTTOM,
          }}
        >
          <Button
            rightIcon={IconNames.CHEVRON_DOWN}
            text={selectedOption.label}
          />
        </StyledDropDown>
      </StyledDropDownContainer>
    );
  }
}

export default StyledDropdown;
