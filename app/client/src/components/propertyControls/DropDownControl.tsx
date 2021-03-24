import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDropDownContainer } from "./StyledControls";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";

class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    let defaultSelected: DropdownOption = {
      label: "No results.",
      value: undefined,
    };

    const selected: DropdownOption = this.props.options.find(
      (option) => option.value === this.props.propertyValue,
    );

    if (selected) {
      defaultSelected = selected;
    }

    return (
      <StyledDropDownContainer>
        <Dropdown
          options={this.props.options}
          selected={defaultSelected}
          onSelect={this.onItemSelect}
          width="100%"
          optionWidth={
            this.props.optionWidth ? this.props.optionWidth : "187px"
          }
        />
      </StyledDropDownContainer>
    );
  }

  onItemSelect = (value?: string): void => {
    if (value) {
      this.updateProperty(this.props.propertyName, value);
    }
  };

  isOptionSelected = (selectedOption: any) => {
    return selectedOption.value === this.props.propertyValue;
  };

  static getControlType() {
    return "DROP_DOWN";
  }
}

export interface DropDownControlProps extends ControlProps {
  options: any[];
  placeholderText: string;
  propertyValue: string;
  optionWidth?: string;
}

export default DropDownControl;
