import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledDropDown, StyledDropDownContainer } from "./StyledControls";
import { DropdownOption } from "components/ads/Dropdown";
import { isNil } from "lodash";

class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    let defaultSelected: DropdownOption = {
      label: "No selection.",
      value: undefined,
    };
    if (this.props.defaultValue) {
      defaultSelected = this.props.options.find(
        (option) => option.value === this.props.defaultValue,
      );
    }

    const selected: DropdownOption = this.props.options.find(
      (option) => option.value === this.props.propertyValue,
    );

    if (selected) {
      defaultSelected = selected;
    }

    return (
      <StyledDropDownContainer>
        <StyledDropDown
          dropdownHeight={this.props.dropdownHeight}
          enableSearch={this.props.enableSearch}
          hideSubText={this.props.hideSubText}
          onSelect={this.onItemSelect}
          optionWidth={
            this.props.optionWidth ? this.props.optionWidth : "231px"
          }
          options={this.props.options}
          searchPlaceholder={this.props.placeholderText}
          selected={defaultSelected}
          showLabelOnly
          width="100%"
        />
      </StyledDropDownContainer>
    );
  }

  onItemSelect = (value?: string): void => {
    if (!isNil(value)) {
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
  defaultValue?: string;
  placeholderText: string;
  dropdownHeight?: string;
  enableSearch?: boolean;
  propertyValue: string;
  optionWidth?: string;
  hideSubText?: boolean;
}

export default DropDownControl;
