import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { ControlType } from "constants/PropertyControlConstants";
import { get, isNil } from "lodash";
import {
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getDynamicFetchedValues } from "selectors/formSelectors";
import { change, getFormValues } from "redux-form";
import {
  FormDataPaths,
  matchExact,
  MATCH_ACTION_CONFIG_PROPERTY,
} from "workers/formEval";
import { Action } from "entities/Action";

const DropdownSelect = styled.div<{
  width: string;
}>`
  font-size: 14px;
  width: ${(props) => (props?.width ? props?.width : "280px")};
`;

class DropDownControl extends BaseControl<Props> {
  componentDidUpdate(prevProps: Props) {
    // if options received by the fetchDynamicValues for the multi select changes, update the config property path's values.
    // we do this to make sure, the data does not contain values from the previous options.
    // we check if the fetchDynamicValue dependencies of the multiselect dropdown has changed values
    // if it has, we reset the values multiselect of the dropdown.
    if (this.props.fetchOptionsConditionally && this.props.isMultiSelect) {
      const dependencies = matchExact(
        MATCH_ACTION_CONFIG_PROPERTY,
        this?.props?.conditionals?.fetchDynamicValues?.condition,
      );

      let hasDependenciesChanged = false;

      if (!!dependencies && dependencies.length > 0) {
        dependencies.forEach((dependencyPath) => {
          const prevValue = get(prevProps?.formValues, dependencyPath);
          const currentValue = get(this.props?.formValues, dependencyPath);
          if (prevValue !== currentValue) {
            hasDependenciesChanged = true;
          }
        });
      }
      if (hasDependenciesChanged) {
        this.props.updateConfigPropertyValue(
          this.props.formName,
          this.props.configProperty,
          [],
        );
      }
    }

    // For entity types to query on the datasource
    // when the command is changed, we want to clear the entity, so users can choose the entity type they want to work with
    // this also prevents the wrong entity type value from being persisted in the event that the new command value does not match the entity type.
    if (this.props.configProperty === FormDataPaths.ENTITY_TYPE) {
      const prevCommandValue = get(
        prevProps?.formValues,
        FormDataPaths.COMMAND,
      );
      const currentCommandValue = get(
        this.props?.formValues,
        FormDataPaths.COMMAND,
      );
      if (prevCommandValue !== currentCommandValue) {
        this.props.updateConfigPropertyValue(
          this.props.formName,
          this.props.configProperty,
          "",
        );
      }
    }
  }

  render() {
    const styles = {
      width: "280px",
      ...("customStyles" in this.props &&
      typeof this.props.customStyles === "object"
        ? this.props.customStyles
        : {}),
    };

    return (
      <DropdownSelect
        className={`t--${this?.props?.configProperty}`}
        data-cy={this.props.configProperty}
        style={styles}
        width={styles.width}
      >
        <Field
          component={renderDropdown}
          name={this.props.configProperty}
          props={{ ...this.props, width: styles.width }}
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
  if (isNil(props.input?.value)) {
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
    if (!isNil(value)) {
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
    if (!isNil(value)) {
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
      allowDeselection={props?.isMultiSelect}
      boundary="window"
      cypressSelector={`t--dropdown-${props?.configProperty}`}
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
  fetchOptionsConditionally?: boolean;
  isLoading: boolean;
  formValues: Partial<Action>;
}

type ReduxDispatchProps = {
  updateConfigPropertyValue: (
    formName: string,
    field: string,
    value: any,
  ) => void;
};

type Props = DropDownControlProps & ReduxDispatchProps;

const mapStateToProps = (
  state: AppState,
  ownProps: DropDownControlProps,
): {
  isLoading: boolean;
  options: DropdownOption[];
  formValues: Partial<Action>;
} => {
  // Added default options to prevent error when options is undefined
  let isLoading = false;
  let options: DropdownOption[] = ownProps.fetchOptionsConditionally
    ? []
    : ownProps.options;
  const formValues: Partial<Action> = getFormValues(ownProps.formName)(state);

  try {
    if (ownProps.fetchOptionsConditionally) {
      const dynamicFetchedValues = getDynamicFetchedValues(state, ownProps);
      isLoading = dynamicFetchedValues.isLoading;
      options = dynamicFetchedValues.data;
    }
  } catch (e) {
  } finally {
    return { isLoading, options, formValues };
  }
};

const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  updateConfigPropertyValue: (formName: string, field: string, value: any) => {
    dispatch(change(formName, field, value));
  },
});

// Connecting this componenet to the state to allow for dynamic fetching of options to be updated.
export default connect(mapStateToProps, mapDispatchToProps)(DropDownControl);
