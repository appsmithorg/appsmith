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
    let width = "20vw";
    let height = "38px";
    if (
      "customStyles" in this.props &&
      !!this.props.customStyles &&
      "width" in this.props.customStyles
    ) {
      width = this.props.customStyles.width;
    }

    if (
      "customStyles" in this.props &&
      !!this.props.customStyles &&
      "height" in this.props.customStyles
    ) {
      height = this.props.customStyles.height;
    }

    return (
      <DropdownSelect data-cy={this.props.configProperty} style={{ width }}>
        <Field
          component={renderDropdown}
          name={this.props.configProperty}
          props={{
            ...this.props,
            width,
            height,
            containerClassName: this.props?.containerClassName,
          }}
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
    height: string;
    containerClassName?: string;
  } & DropDownControlProps,
): JSX.Element {
  let selectedValue = props.input?.value;
  if (_.isUndefined(props.input?.value)) {
    selectedValue = props?.initialValue;
  }
  let options: DropdownOption[] = [];
  let selectedOption = {};
  if (typeof props.options === "object" && Array.isArray(props.options)) {
    options = props.options;
    selectedOption =
      options.find(
        (option: DropdownOption) => option.value === selectedValue,
      ) || {};
  }
  return (
    <Dropdown
      boundary="window"
      containerClassName={props.containerClassName}
      disabled={props.disabled}
      dontUsePortal={false}
      dropdownMaxHeight="250px"
      height={props.height}
      isLoading={props.isLoading}
      isMultiSelect={props?.isMultiSelect}
      onSelect={props.input?.onChange}
      optionWidth={props.width}
      options={options}
      placeholder={props?.placeholderText}
      selected={selectedOption}
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
