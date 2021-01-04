import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { Button, MenuItem } from "@blueprintjs/core";
import { IItemRendererProps } from "@blueprintjs/select";
import { StyledDropDown, StyledDropDownContainer } from "./StyledControls";
import { DropdownOption } from "widgets/DropdownWidget";

class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    const selected: DropdownOption | undefined = this.props.options.find(
      (option) => option.value === this.props.propertyValue,
    );
    return (
      <StyledDropDownContainer>
        <StyledDropDown
          items={this.props.options}
          filterable={false}
          itemRenderer={this.renderItem}
          onItemSelect={this.onItemSelect}
          noResults={<MenuItem disabled={true} text="No results." />}
          popoverProps={{
            minimal: true,
            usePortal: false,
          }}
        >
          <Button
            text={selected ? selected.label : ""}
            rightIcon="chevron-down"
          />
        </StyledDropDown>
      </StyledDropDownContainer>
    );
  }

  onItemSelect = (item: DropdownOption): void => {
    this.updateProperty(this.props.propertyName, item.value);
  };

  renderItem = (option: DropdownOption, itemProps: IItemRendererProps) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    const isSelected: boolean = this.isOptionSelected(option);
    return (
      <MenuItem
        className="single-select"
        active={isSelected}
        key={option.value}
        onClick={itemProps.handleClick}
        text={option.label}
      />
    );
  };

  isOptionSelected = (selectedOption: DropdownOption) => {
    return selectedOption.value === this.props.propertyValue;
  };

  static getControlType() {
    return "DROP_DOWN";
  }
}

export interface DropDownControlProps extends ControlProps {
  options: DropdownOption[];
  placeholderText: string;
  propertyValue: string;
}

export default DropDownControl;
