import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import { MenuItem } from "@blueprintjs/core";
import { IItemRendererProps } from "@blueprintjs/select";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import { DropdownOption } from "components/constants";
import { ControlType } from "constants/PropertyControlConstants";
import { theme } from "constants/DefaultTheme";
import FormLabel from "components/editorComponents/FormLabel";
import { Colors } from "constants/Colors";

const DropdownSelect = styled.div`
  font-size: 14px;
  width: 50vh;
`;

const StyledInfo = styled.span`
  font-weight: normal;
  line-height: normal;
  color: ${Colors.DOVE_GRAY};
  font-size: 12px;
  margin-left: 1px;
`;

const customSelectStyles = {
  option: (
    styles: { [x: string]: any },
    { isDisabled, isFocused, isSelected }: any,
  ) => {
    return {
      ...styles,
      color: Colors.CODE_GRAY,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
        ? Colors.GREY_3
        : isFocused
        ? Colors.GREY_2
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
    const { configProperty, isRequired, label, options, subtitle } = this.props;

    return (
      <div>
        <FormLabel>
          {label} {isRequired && "*"}
          {subtitle && (
            <>
              <br />
              <StyledInfo>{subtitle}</StyledInfo>
            </>
          )}
        </FormLabel>
        <DropdownSelect data-cy={configProperty}>
          <DropdownField
            customSelectStyles={customSelectStyles}
            name={configProperty}
            options={options}
            placeholder=""
            width={"50vh"}
          />
        </DropdownSelect>
      </div>
    );
  }

  renderItem = (option: DropdownOption, itemProps: IItemRendererProps) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    const isSelected: boolean = this.isOptionSelected(option);
    return (
      <MenuItem
        active={isSelected}
        className="single-select"
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
  subtitle?: string;
}

export default DropDownControl;
