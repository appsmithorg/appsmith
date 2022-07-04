import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";
import { StyledDropDown, StyledDropDownContainer } from "./StyledControls";
import { DropdownOption } from "components/ads/Dropdown";
import { isNil } from "lodash";
import { isDynamicValue } from "utils/DynamicBindingUtils";

class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    let defaultSelected: DropdownOption | DropdownOption[] = {
      label: "No selection.",
      value: undefined,
    };

    if (this.props.isMultiSelect) {
      defaultSelected = [defaultSelected];
    }

    const options = this.props?.options || [];

    if (this.props.defaultValue) {
      if (this.props.isMultiSelect) {
        const defaultValueSet = new Set(this.props.defaultValue);
        defaultSelected = options.filter((option) =>
          defaultValueSet.has(option.value),
        );
      } else {
        defaultSelected = options.find(
          (option) => option.value === this.props.defaultValue,
        );
      }
    }

    let selected: DropdownOption | DropdownOption[];

    if (this.props.isMultiSelect) {
      const propertyValueSet = new Set(this.props.propertyValue);
      selected = options.filter((option) => propertyValueSet.has(option.value));
    } else {
      const computedValue =
        !isNil(this.props.propertyValue) &&
        isDynamicValue(this.props.propertyValue)
          ? this.props.evaluatedValue
          : this.props.propertyValue;

      selected = options.find((option) => option.value === computedValue);
    }

    if (selected) {
      defaultSelected = selected;
    }

    return (
      <StyledDropDownContainer>
        <StyledDropDown
          dropdownHeight={this.props.dropdownHeight}
          dropdownMaxHeight="200px"
          enableSearch={this.props.enableSearch}
          fillOptions
          hideSubText={this.props.hideSubText}
          isMultiSelect={this.props.isMultiSelect}
          onSelect={this.onItemSelect}
          optionWidth={
            this.props.optionWidth ? this.props.optionWidth : "231px"
          }
          options={options}
          placeholder={this.props.placeholderText}
          removeSelectedOption={this.onItemRemove}
          searchPlaceholder={this.props.searchPlaceholderText}
          selected={defaultSelected}
          showLabelOnly
          width="100%"
        />
      </StyledDropDownContainer>
    );
  }

  onItemSelect = (value?: string): void => {
    if (!isNil(value)) {
      let selectedValue: string | string[] = this.props.propertyValue;
      if (this.props.isMultiSelect) {
        if (Array.isArray(selectedValue)) {
          const index = selectedValue.indexOf(value);
          if (index >= 0) {
            selectedValue = [
              ...selectedValue.slice(0, index),
              ...selectedValue.slice(index + 1),
            ];
          } else {
            selectedValue = [...selectedValue, value];
          }
        } else {
          selectedValue = [selectedValue, value];
        }
      } else {
        selectedValue = value;
      }
      this.updateProperty(this.props.propertyName, selectedValue);
    }
  };

  onItemRemove = (value?: string) => {
    if (!isNil(value)) {
      let selectedValue: string | string[] = this.props.propertyValue;
      if (this.props.isMultiSelect) {
        if (Array.isArray(selectedValue)) {
          const index = selectedValue.indexOf(value);
          if (index >= 0) {
            selectedValue = [
              ...selectedValue.slice(0, index),
              ...selectedValue.slice(index + 1),
            ];
          }
        } else {
          selectedValue = [];
        }
      } else {
        selectedValue = "";
      }
      this.updateProperty(this.props.propertyName, selectedValue);
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
        ?.map((x: { value: string }) => x.value.toString())
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
  searchPlaceholderText: string;
  isMultiSelect?: boolean;
  dropdownHeight?: string;
  enableSearch?: boolean;
  propertyValue: string;
  optionWidth?: string;
  hideSubText?: boolean;
}

export default DropDownControl;
