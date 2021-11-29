import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import _ from "lodash";
import { DropdownOption } from "components/ads/Dropdown";
import { StyledMultiSelectDropDown } from "./StyledControls";

class SingleSelectControl extends BaseControl<SingleSelectControlProps> {
  render() {
    const selectedItems: string[] = [];

    _.map(this.props.propertyValue, (value) => {
      const option = _.find(this.props.options, (option) => {
        return option.value === value;
      });
      if (option) selectedItems.push(option.value as string);
      return option;
    });

    return (
      <StyledMultiSelectDropDown
        onSelect={this.onItemSelect}
        optionWidth="187px"
        options={this.props.options}
        selected={selectedItems}
        showLabelOnly
        width="100%"
      />
    );
  }

  onItemSelect = (value: string[]): void => {
    if (value.length > 1) {
      value.shift();
    }
    this.updateProperty(this.props.propertyName, value);
  };

  static getControlType() {
    return "SINGLE_SELECT";
  }
}

export interface SingleSelectControlProps extends ControlProps {
  options: DropdownOption[];
  placeholderText: string;
  propertyValue: string[];
}

export default SingleSelectControl;
