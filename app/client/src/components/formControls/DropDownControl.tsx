import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { ControlType } from "constants/PropertyControlConstants";
import {
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";

const DropdownSelect = styled.div`
  font-size: 14px;
  width: 50vh;
`;

class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    return (
      <div>
        <DropdownSelect data-cy={this.props.configProperty}>
          <Field
            component={renderDropdown}
            name={this.props.configProperty}
            options={this.props.options}
            props={this.props}
          />
        </DropdownSelect>
      </div>
    );
  }

  getControlType(): ControlType {
    return "DROP_DOWN";
  }
}

function renderDropdown(props: {
  input?: WrappedFieldInputProps;
  meta?: WrappedFieldMetaProps;
  props: DropDownControlProps;
  options: { label: string; value: string }[];
}): JSX.Element {
  const selectedValue = props.input?.value || props?.props?.initialValue;
  const selectedOption =
    props?.options.find(
      (option: DropdownOption) => option.value === selectedValue,
    ) || {};
  return (
    <Dropdown
      dontUsePortal={false}
      dropdownMaxHeight="250px"
      enableSearch
      errorMsg={props.props?.errorText}
      fillOptions
      helperText={props.props?.info}
      onSelect={props.input?.onChange}
      {...props}
      options={props.options}
      {...props.input}
      boundary={"window"}
      placeholder={props.props?.placeholderText}
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
