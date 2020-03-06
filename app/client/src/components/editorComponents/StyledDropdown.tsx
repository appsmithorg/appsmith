import React from "react";
import _ from "lodash";
import { DropdownOption } from "widgets/DropdownWidget";
import {
  StyledPopover,
  StyledDropDownContainer,
  StyledMenuItem,
} from "components/propertyControls/StyledControls";
import {
  Button,
  Menu,
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
      <StyledMenuItem
        className="single-select"
        active={isSelected}
        key={option.value}
        onClick={option.children ? _.noop : () => this.handleSelect(option)}
        text={option.label}
        popoverProps={{
          minimal: true,
          interactionKind: PopoverInteractionKind.CLICK,
          position: PopoverPosition.RIGHT,
        }}
      >
        {option.children && option.children.map(this.renderItem)}
      </StyledMenuItem>
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
        <StyledPopover
          usePortal={true}
          minimal={true}
          content={<Menu>{this.props.options.map(this.renderItem)}</Menu>}
        >
          <Button
            rightIcon={IconNames.CHEVRON_DOWN}
            text={selectedOption.label}
          />
        </StyledPopover>
      </StyledDropDownContainer>
    );
  }
}

export default StyledDropdown;
