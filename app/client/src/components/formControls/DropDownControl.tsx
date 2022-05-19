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
import { getDynamicFetchedValues } from "selectors/formSelectors";

const DropdownSelect = styled.div`
  font-size: 14px;
  width: 20vw;
`;

class DropDownControl extends BaseControl<DropDownControlProps> {
  render() {
    let width = "35vw";
    if (
      "customStyles" in this.props &&
      !!this.props.customStyles &&
      "width" in this.props.customStyles
    ) {
      width = this.props.customStyles.width;
    }

    return (
      <DropdownSelect data-cy={this.props.configProperty} style={{ width }}>
        <Field
          component={renderDropdown}
          name={this.props.configProperty}
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

function renderDropdown(
  props: {
    input?: WrappedFieldInputProps;
    meta?: Partial<WrappedFieldMetaProps>;
    width: string;
  } & DropDownControlProps,
): JSX.Element {
  let selectedValue: string | string[];
  if (_.isNil(props.input?.value)) {
    if (props.isMultiSelect)
      selectedValue = props?.initialValue ? (props.initialValue as string) : [];
    else
      selectedValue = props?.initialValue
        ? (props.initialValue as string[])
        : "";
  } else {
    selectedValue = props.input?.value;
    if (props.isMultiSelect) {
      if (!Array.isArray(selectedValue)) {
        selectedValue = [selectedValue];
      } else {
        selectedValue = [...new Set(selectedValue)];
      }
    }
  }
  let options: DropdownOption[] = [];
  let selectedOptions: DropdownOption[] = [];
  if (typeof props.options === "object" && Array.isArray(props.options)) {
    options = props.options;
    selectedOptions =
      options.filter((option: DropdownOption) => {
        if (props.isMultiSelect)
          return selectedValue.includes(option.value as string);
        else return selectedValue === option.value;
      }) || [];
  }
  // Function to handle selction of options
  const onSelectOptions = (value: string | undefined) => {
    if (!_.isNil(value)) {
      if (props.isMultiSelect) {
        if (Array.isArray(selectedValue)) {
          if (!selectedValue.includes(value))
            (selectedValue as string[]).push(value);
        } else {
          selectedValue = [selectedValue as string, value];
        }
      } else selectedValue = value;
      props.input?.onChange(selectedValue);
    }
  };

  // Function to handle deselction of options
  const onRemoveOptions = (value: string | undefined) => {
    if (!_.isNil(value)) {
      if (props.isMultiSelect) {
        if (Array.isArray(selectedValue)) {
          if (selectedValue.includes(value))
            (selectedValue as string[]).splice(
              (selectedValue as string[]).indexOf(value),
              1,
            );
        } else {
          selectedValue = [];
        }
      } else selectedValue = "";
      props.input?.onChange(selectedValue);
    }
  };

  return (
    <Dropdown
      boundary="window"
      disabled={props.disabled}
      dontUsePortal={false}
      dropdownMaxHeight="250px"
      enableSearch={props.isSearchable}
      isLoading={props.isLoading}
      isMultiSelect={props?.isMultiSelect}
      onSelect={onSelectOptions}
      optionWidth={props.width}
      options={options}
      placeholder={props?.placeholderText}
      removeSelectedOption={onRemoveOptions}
      selected={props.isMultiSelect ? selectedOptions : selectedOptions[0]}
      showLabelOnly
      width={props.width}
    />
  );
}

export interface DropDownControlProps extends ControlProps {
  options: DropdownOption[];
  placeholderText: string;
  propertyValue: string;
  subtitle?: string;
  isMultiSelect?: boolean;
  isSearchable?: boolean;
  fetchOptionsCondtionally?: boolean;
  isLoading: boolean;
}

const mapStateToProps = (
  state: AppState,
  ownProps: DropDownControlProps,
): { isLoading: boolean; options: DropdownOption[] } => {
  // Added default options to prevent error when options is undefined
  let isLoading = false;
  let options: DropdownOption[] = ownProps.fetchOptionsCondtionally
    ? []
    : ownProps.options;

  try {
    if (ownProps.fetchOptionsCondtionally) {
      const dynamicFetchedValues = getDynamicFetchedValues(
        state,
        ownProps.configProperty,
      );
      isLoading = dynamicFetchedValues.isLoading;
      options = dynamicFetchedValues.data;
    }
    return { isLoading, options };
  } catch (e) {
    return {
      isLoading,
      options,
    };
  }
};

// Connecting this componenet to the state to allow for dynamic fetching of options to be updated.
export default connect(mapStateToProps)(DropDownControl);
