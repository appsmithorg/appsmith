import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { ControlType } from "constants/PropertyControlConstants";
import _ from "lodash";
import { FieldArray, getFormValues } from "redux-form";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { QueryAction } from "entities/Action";

const DropdownSelect = styled.div`
  font-size: 14px;
  width: 50vh;
`;

class ProjectionSelectorControl extends BaseControl<
  ProjectionSelectorControlProps
> {
  render() {
    let width = "50vh";
    if (this.props.customStyles && this.props?.customStyles?.width) {
      width = this.props?.customStyles?.width;
    }

    return (
      <DropdownSelect data-cy={this.props.configProperty} style={{ width }}>
        <FieldArray
          component={renderDropdown}
          name={this.props.configProperty}
          options={this.props.options}
          props={{ ...this.props, width }}
          rerenderOnEveryChange={false}
        />
      </DropdownSelect>
    );
  }

  getControlType(): ControlType {
    return "PROJECTION";
  }
}

function renderDropdown(props: any): JSX.Element {
  // values that have been selected and stored in redux form state.
  let selectedValues = props?.fields.getAll();
  if (_.isUndefined(selectedValues)) {
    selectedValues = props?.initialValue || [];
  }

  // options that correspond to the selected values kept in redux form state.
  // the dropdown component requires the entire option object and not just the value.
  const selectedOptions = props.dropDownOptions.filter(
    (option: DropdownOption) => selectedValues.includes(option.value),
  );

  // select option
  const onSelectOptions = (option: string | undefined) => {
    if (option) {
      props.fields.push(option);
    }
  };

  // remove options
  const removeOption = (option: string | undefined) => {
    const options = selectedValues.map((field: DropdownOption) => field);
    const optionIndex = options.indexOf(option);

    props.fields.remove(optionIndex);
  };

  return (
    <Dropdown
      boundary="window"
      disabled={props.disabled}
      dontUsePortal={false}
      dropdownMaxHeight="250px"
      errorMsg={props.props?.errorText}
      helperText={props.props?.info}
      isMultiSelect
      onSelect={onSelectOptions}
      optionWidth="50vh"
      options={props.dropDownOptions}
      placeholder={props.props?.placeholderText || "Select options"}
      removeSelectedOption={removeOption}
      selected={selectedOptions}
      showLabelOnly
      width={props?.props?.width ? props?.props?.width : "50vh"}
    />
  );
}

export interface ProjectionSelectorControlProps extends ControlProps {
  options: DropdownOption[];
  placeholderText: string;
  propertyValue: string;
  subtitle?: string;
  isMultiSelect?: boolean;
  isSearchable?: boolean;
  fetchOptionsCondtionally?: boolean;
}
const mapStateToProps = (
  state: AppState,
  ownProps: ProjectionSelectorControlProps,
) => {
  let dropDownOptions: DropdownOption[] = [];

  // if the component has an option enabled to fetch the options dynamically,
  if (ownProps.fetchOptionsCondtionally) {
    // TODO: this is just a test, will be updated once the fetchDynamicFormData is implemented
    dropDownOptions = [
      { label: "Test1", value: "SINGLE" },
      { label: "Test2", value: "ALL" },
    ];
    const dynamicFormDataString = _.get(
      getFormValues(QUERY_EDITOR_FORM_NAME)(state) as QueryAction,
      "actionConfiguration.formData.updateMany.query",
    );

    // ownProps.configProperty will be used to filter from the array of data
    // const dynamicFormDataString = getFormEvaluationState(state);

    try {
      dropDownOptions = JSON.parse(dynamicFormDataString);
    } catch (e) {
      dropDownOptions = [];
    }
  } else {
    dropDownOptions = ownProps.options;
  }

  return {
    dropDownOptions,
  };
};

export default connect(mapStateToProps)(ProjectionSelectorControl);
