import React, { SyntheticEvent } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "../constants/PropertyControlConstants";
import { Button, MenuItem } from "@blueprintjs/core";
import { IItemRendererProps } from "@blueprintjs/select";
import { ControlWrapper, StyledDropDown } from "./StyledControls";

class DropDownControl extends BaseControl<DropDownControlProps> {
  constructor(props: DropDownControlProps) {
    super(props);
    this.onItemSelect = this.onItemSelect.bind(this);
  }

  render() {
    const selected: DropdownOption | undefined = this.props.options.find(
      option => option.value === this.props.propertyValue,
    );
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        <StyledDropDown
          items={this.props.options}
          itemPredicate={this.filterOption}
          itemRenderer={this.renderItem}
          onItemSelect={this.onItemSelect}
          noResults={<MenuItem disabled={true} text="No results." />}
        >
          <Button
            text={selected ? selected.label : ""}
            rightIcon="chevron-down"
          />
        </StyledDropDown>
      </ControlWrapper>
    );
  }

  onItemSelect(
    item: DropdownOption,
    event?: SyntheticEvent<HTMLElement>,
  ): void {
    this.updateProperty(this.props.propertyName, item.value);
  }

  renderItem(option: DropdownOption, itemProps: IItemRendererProps) {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    return (
      <MenuItem
        active={itemProps.modifiers.active}
        key={option.value}
        label={option.label}
        onClick={itemProps.handleClick}
        text={option.label}
      />
    );
  }

  filterOption(query: string, option: DropdownOption): boolean {
    return (
      option.label.toLowerCase().indexOf(query.toLowerCase()) >= 0 ||
      option.value.toLowerCase().indexOf(query.toLowerCase()) >= 0
    );
  }

  getControlType(): ControlType {
    return "DROP_DOWN";
  }
}

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropDownControlProps extends ControlProps {
  options: DropdownOption[];
}

export default DropDownControl;
