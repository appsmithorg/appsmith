import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { ControlType } from "constants/PropertyControlConstants";
import _ from "lodash";
import {
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import { connect } from "react-redux";
import { AppState } from "reducers";

const DropdownSelect = styled.div`
  font-size: 14px;
  width: 50vh;
`;

class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    let width = "50vh";
    if (this.props.customStyles && this.props?.customStyles?.width) {
      width = this.props?.customStyles?.width;
    }

    return (
      <DropdownSelect data-cy={this.props.configProperty} style={{ width }}>
        <Field
          component={renderDropdown}
          name={this.props.configProperty}
          options={this.props.options}
          props={{ ...this.props, width }}
          type={this.props?.isMultiSelect ? "select-multiple" : undefined}
        />
      </DropdownSelect>
    );
  }

  getControlType(): ControlType {
    return "DROP_DOWN";
  }
}

function renderDropdown(props: {
  input?: WrappedFieldInputProps;
  meta?: WrappedFieldMetaProps;
  props: DropDownControlProps & { width?: string };
  fetchOptionsCondtionally: boolean;
  formName: string;
  dropDownOptions: DropdownOption[];
}): JSX.Element {
  let selectedValue = props.input?.value;
  if (_.isUndefined(props.input?.value)) {
    selectedValue = props?.props?.initialValue;
  }
  const selectedOption =
    props.dropDownOptions.find(
      (option: DropdownOption) => option.value === selectedValue,
    ) || {};
  return (
    <Dropdown
      boundary="window"
      dontUsePortal={false}
      dropdownMaxHeight="250px"
      errorMsg={props.props?.errorText}
      helperText={props.props?.info}
      isMultiSelect={props?.props?.isMultiSelect}
      onSelect={props.input?.onChange}
      optionWidth="50vh"
      options={props.dropDownOptions}
      placeholder={props.props?.placeholderText}
      selected={selectedOption}
      showLabelOnly
      width={props?.props?.width ? props?.props?.width : "50vh"}
    />
  );
}

export interface DropDownControlProps extends ControlProps {
  options: DropdownOption[];
  placeholderText: string;
  propertyValue: string;
  subtitle?: string;
  isMultiSelect?: boolean;
  isDisabled?: boolean;
  isSearchable?: boolean;
  fetchOptionsCondtionally?: boolean;
}
const mapStateToProps = (state: AppState, ownProps: DropDownControlProps) => {
  let dropDownOptions: DropdownOption[] = [];

  // if the component has an option enabled to fetch the options dynamically,
  if (ownProps.fetchOptionsCondtionally) {
    // TODO: this is just a test, will be updated once the fetchDynamicFormData is implemented
    dropDownOptions = [
      { label: "Test1", value: "SINGLE" },
      { label: "Test2", value: "ALL" },
    ];
  } else {
    dropDownOptions = ownProps.options;
  }

  return {
    dropDownOptions,
  };
};

export default connect(mapStateToProps)(DropDownControl);
