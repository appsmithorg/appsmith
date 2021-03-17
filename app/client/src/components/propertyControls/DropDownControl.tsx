import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDropDown, StyledDropDownContainer } from "./StyledControls";
import { DropdownOption } from "components/ads/Dropdown";

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
        <StyledDropDown
          options={this.props.options}
          selected={defaultSelected}
          onSelect={this.onItemSelect}
          width="100%"
          showLabelOnly={true}
          optionWidth="187px"
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
}

export default DropDownControl;
