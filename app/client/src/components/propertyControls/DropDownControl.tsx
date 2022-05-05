import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import { StyledDropDown, StyledDropDownContainer } from "./StyledControls";
import { DropdownOption } from "components/ads/Dropdown";
import { isNil } from "lodash";
import { isDynamicValue } from "utils/DynamicBindingUtils";

class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    let defaultSelected: DropdownOption = {
      label: "No selection.",
      value: undefined,
    };

    const options = this.props?.options || [];

    if (this.props.defaultValue) {
      defaultSelected = options.find(
        (option) => option.value === this.props.defaultValue,
      );
    }

    const computedValue =
      !isNil(this.props.propertyValue) &&
      isDynamicValue(this.props.propertyValue)
        ? this.props.evaluatedValue
        : this.props.propertyValue;

    const selected: DropdownOption = options.find(
      (option) => option.value === computedValue,
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
          options={options}
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

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    if (
      (config as DropDownControlProps)?.options
        ?.map((x: { value: string }) => x.value)
        .includes(value)
    )
      return true;
    return false;
  }
}

export interface DropDownControlProps extends ControlProps {
  options?: any[];
  defaultValue?: string;
  placeholderText: string;
  dropdownHeight?: string;
  enableSearch?: boolean;
  propertyValue: string;
  optionWidth?: string;
  hideSubText?: boolean;
}

export default DropDownControl;
