import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "../../constants/PropertyControlConstants";
import { MenuItem } from "@blueprintjs/core";
import { IItemRendererProps } from "@blueprintjs/select";
import { ControlWrapper, StyledMultiSelectDropDown } from "./StyledControls";
import _ from "lodash";
import { DropdownOption } from "../../widgets/DropdownWidget";

class MultiSelectControl extends BaseControl<MultiSelectControlProps> {
  render() {
    const selectedItems: DropdownOption[] = [];
    _.map(this.props.propertyValue, value => {
      const option = _.find(this.props.options, option => {
        return option.value === value;
      });
      if (option) selectedItems.push(option);
      return option;
    });
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        {
          <StyledMultiSelectDropDown
            items={this.props.options}
            placeholder={this.props.placeholderText}
            itemRenderer={this.renderItem}
            tagRenderer={this.renderTag}
            selectedItems={selectedItems}
            tagInputProps={{ onRemove: this.onItemRemoved }}
            onItemSelect={this.onItemSelect}
            noResults={<MenuItem disabled={true} text="No results." />}
          />
        }
      </ControlWrapper>
    );
  }

  onItemRemoved = (_tag: string, index: number) => {
    const optionValues = this.props.propertyValue.filter(
      (value: string, valueIndex: number) => {
        return valueIndex !== index;
      },
    );
    this.updateProperty(this.props.propertyName, optionValues);
  };

  renderTag = (option: DropdownOption) => {
    return option.label;
  };

  onItemSelect = (option: DropdownOption): void => {
    if (this.isOptionSelected(option)) {
      const optionValues = this.props.propertyValue.filter((value: string) => {
        return value !== option.value;
      });
      this.updateProperty(this.props.propertyName, optionValues);
    } else {
      const optionValues = this.props.propertyValue || [];
      optionValues.push(option.value);
      this.updateProperty(this.props.propertyName, optionValues);
    }
  };

  renderItem = (option: DropdownOption, itemProps: IItemRendererProps) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    const isSelected: boolean = this.isOptionSelected(option);
    return (
      <MenuItem
        icon={isSelected ? "tick" : "blank"}
        active={itemProps.modifiers.active}
        key={option.value}
        onClick={itemProps.handleClick}
        text={option.label}
      />
    );
  };

  isOptionSelected = (selectedOption: DropdownOption) => {
    return (
      _.findIndex(this.props.propertyValue, value => {
        return value === selectedOption.value;
      }) !== -1
    );
  };

  getControlType(): ControlType {
    return "MULTI_SELECT";
  }
}

export interface MultiSelectControlProps extends ControlProps {
  options: DropdownOption[];
  placeholderText: string;
  propertyValue: string[];
}

export default MultiSelectControl;
