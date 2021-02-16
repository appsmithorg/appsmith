import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { Button, MenuItem } from "@blueprintjs/core";
import { IItemRendererProps } from "@blueprintjs/select";
import {
  StyledDropDown,
  StyledDropDownContainer,
  DropdownStyles,
} from "./StyledControls";
import { ControlIcons, ControlIconName } from "icons/ControlIcons";
import { DropdownOption } from "widgets/DropdownWidget";
import styled from "styled-components";

const MenuItemWrapper = styled(MenuItem)`
  z-index: 2;
  &&&& span {
    width: auto;
    font-size: 12px;
    line-height: 20px;
    color: #2e3d49;
  }
  &&&& div:first-child {
    flex: none;
  }
`;

class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    const selected: DropdownOption | undefined = this.props.options.find(
      (option) => option.value === this.props.propertyValue,
    );
    const controlIconName: ControlIconName =
      selected && selected.icon ? selected.icon : -1;
    const ControlIcon =
      controlIconName !== -1 ? ControlIcons[controlIconName] : null;
    return (
      <StyledDropDownContainer>
        <DropdownStyles />
        <StyledDropDown
          items={this.props.options}
          filterable={false}
          itemRenderer={this.renderItem}
          onItemSelect={this.onItemSelect}
          noResults={<MenuItem disabled={true} text="No results." />}
          popoverProps={{
            minimal: true,
            usePortal: true,
            popoverClassName: "select-popover-wrapper",
          }}
        >
          <Button
            icon={
              selected && selected.icon && ControlIcon ? (
                <ControlIcon width={24} height={24} />
              ) : null
            }
            text={selected ? selected.label : "No Selection"}
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
    const controlIconName: ControlIconName = option.icon ? option.icon : -1;
    const ControlIcon =
      controlIconName !== -1 ? ControlIcons[controlIconName] : null;
    return (
      <MenuItemWrapper
        className="single-select"
        active={isSelected}
        key={option.value}
        onClick={itemProps.handleClick}
        text={option.label}
        label={option.subText ? option.subText : undefined}
        icon={
          option.icon && ControlIcon ? (
            <ControlIcon width={24} height={24} />
          ) : (
            undefined
          )
        }
      />
    );
    // label={option.subText ? option.subText : undefined}
    // icon={option.icon && ControlIcon ? <ControlIcon /> : undefined}
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
