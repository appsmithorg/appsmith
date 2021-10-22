import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import { MenuItem } from "@blueprintjs/core";
import { IItemRendererProps } from "@blueprintjs/select";
import Dropdown, {
  DropdownProps,
  DropdownOption,
} from "components/ads/Dropdown";
import { ControlType } from "constants/PropertyControlConstants";
import { theme } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import _ from "lodash";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldProps,
  WrappedFieldInputProps,
} from "redux-form";
const DropdownSelect = styled.div`
  font-size: 14px;
  width: 50vh;
`;

class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    const {
      configProperty,
      initialValue,
      isRequired,
      options,
      placeholderText,
    } = this.props;

    return (
      <div>
        <DropdownSelect data-cy={configProperty}>
          <Field
            component={renderDropdown}
            name={configProperty}
            props={{
              options: options,
              isRequired: isRequired,
              initialValue: initialValue,
              placeholder: placeholderText,
            }}
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

function renderDropdown(props: any): JSX.Element {
  const selectedValue = props.input.value || props.initialValue;
  const selectedOption = props.options.find(
    (option: DropdownOption) => option.value === selectedValue,
  );

  return (
    <Dropdown
      dontUsePortal={false}
      errorMsg={props.errorMsg}
      fillOptions
      helperText={props.helperText}
      onSelect={props.input.onChange}
      options={props.options}
      {...props}
      {...props.input}
      boundary={"window"}
      selected={selectedOption}
      showLabelOnly
      width="100%"
    />
  );
}

export interface DropDownControlProps extends ControlProps {
  options: DropdownOption[];
  placeholderText: string;
  propertyValue: string;
  subtitle?: string;
}

export default DropDownControl;
