import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import { MenuItem } from "@blueprintjs/core";
import { IItemRendererProps } from "@blueprintjs/select";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import { DropdownOption } from "widgets/DropdownWidget";
import { ControlType } from "constants/PropertyControlConstants";
import { theme } from "constants/DefaultTheme";

const DropdownSelect = styled.div`
  font-size: 14px;
  width: 50vh;
`;

const customSelectStyles = {
  option: (
    styles: { [x: string]: any },
    { data, isDisabled, isFocused, isSelected }: any,
  ) => {
    return {
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
        ? theme.colors.primaryOld
        : isFocused
        ? theme.colors.hover
        : undefined,
      ":active": {
        ...styles[":active"],
        backgroundColor:
          !isDisabled &&
          (isSelected ? theme.colors.primaryOld : theme.colors.hover),
      },
    };
  },
};

class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    const { configProperty, options } = this.props;

    return (
      <DropdownSelect data-cy={configProperty}>
        <DropdownField
          placeholder=""
          name={configProperty}
          options={options}
          customSelectStyles={customSelectStyles}
          width={"50vh"}
        />
      </DropdownSelect>
    );
  }

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

  getControlType(): ControlType {
    return "DROP_DOWN";
  }
}

export interface DropDownControlProps extends ControlProps {
  options: DropdownOption[];
  placeholderText: string;
  propertyValue: string;
}

export default DropDownControl;
