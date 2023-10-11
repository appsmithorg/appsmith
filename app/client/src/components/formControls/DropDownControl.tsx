import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import styled from "styled-components";
import type { ControlType } from "constants/PropertyControlConstants";
import { get, isNil } from "lodash";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import { connect } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getDynamicFetchedValues } from "selectors/formSelectors";
import { change, getFormValues } from "redux-form";
import {
  FormDataPaths,
  matchExact,
  MATCH_ACTION_CONFIG_PROPERTY,
} from "workers/Evaluation/formEval";
import type { Action } from "entities/Action";
import type { SelectOptionProps } from "design-system";
import { Icon, Option, Select } from "design-system";

const DropdownSelect = styled.div<{
  width: string;
}>`
  /* font-size: 14px; */
  width: ${(props) => (props?.width ? props?.width : "270px")};
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
      // width: "280px",
      ...("customStyles" in this.props &&
      typeof this.props.customStyles === "object"
        ? this.props.customStyles
        : {}),
    };

    return (
      <DropdownSelect
        className={`t--${this?.props?.configProperty}`}
        data-testid={this.props.configProperty}
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
  let options: SelectOptionProps[] = [];
  let selectedOptions: SelectOptionProps[] = [];
  if (typeof props.options === "object" && Array.isArray(props.options)) {
    options = props.options;
    selectedOptions =
      options.filter((option: SelectOptionProps) => {
        if (props.isMultiSelect)
          return selectedValue.includes(option.value as string);
        else return selectedValue === option.value;
      }) || [];
  }
  // Function to handle selection of options
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

  // Function to handle deselection of options
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

  if (props.options.length > 0) {
    if (props.isMultiSelect) {
      const tempSelectedValues: string[] = [];
      selectedOptions.forEach((option: SelectOptionProps) => {
        if (selectedValue.includes(option.value as string)) {
          tempSelectedValues.push(option.value as string);
        }
      });
      if (tempSelectedValues.length !== selectedValue.length) {
        selectedValue = [...tempSelectedValues];
        props.input?.onChange(tempSelectedValues);
      }
    } else {
      let tempSelectedValues = "";
      selectedOptions.forEach((option: SelectOptionProps) => {
        if (selectedValue === (option.value as string)) {
          tempSelectedValues = option.value as string;
        }
      });

      // we also check if the selected options are present at all.
      // this is because sometimes when a transition is happening the previous options become an empty array.
      // before the new options are loaded.
      if (selectedValue !== tempSelectedValues && selectedOptions.length > 0) {
        selectedValue = tempSelectedValues;
        props.input?.onChange(tempSelectedValues);
      }

      const isOptionDynamic = options.some((opt) => "disabled" in opt);
      if (isOptionDynamic && !!props?.isRequired) {
        const isCurrentOptionDisabled = options.some(
          (opt) => opt?.value === selectedValue && opt.disabled,
        );
        if (!tempSelectedValues || isCurrentOptionDisabled) {
          const firstEnabledOption = props?.options.find(
            (opt) => !opt?.disabled,
          );
          if (firstEnabledOption) {
            selectedValue = firstEnabledOption?.value as string;
            props.input?.onChange(firstEnabledOption?.value);
          }
        }
      }
    }
  }

  return (
    <Select
      data-testid={`t--dropdown-${props?.configProperty}`}
      defaultValue={props.initialValue}
      isDisabled={props.disabled}
      isLoading={props.isLoading}
      isMultiSelect={props?.isMultiSelect}
      onDeselect={onRemoveOptions}
      onSelect={(value) => onSelectOptions(value)}
      placeholder={props?.placeholderText}
      showSearch={props.isSearchable}
      value={props.isMultiSelect ? selectedOptions : selectedOptions[0]}
    >
      {options.map((option) => {
        return (
          <Option
            aria-label={option.label}
            isDisabled={option.isDisabled}
            key={option.value}
            value={option.value}
          >
            {option.icon && <Icon color={option.color} name={option.icon} />}
            {option.label}
          </Option>
        );
      })}
    </Select>
  );
}

export interface DropDownControlProps extends ControlProps {
  options: SelectOptionProps[];
  optionWidth?: string;
  placeholderText: string;
  propertyValue: string;
  subtitle?: string;
  isMultiSelect?: boolean;
  isSearchable?: boolean;
  fetchOptionsConditionally?: boolean;
  isLoading: boolean;
  formValues: Partial<Action>;
}

interface ReduxDispatchProps {
  updateConfigPropertyValue: (
    formName: string,
    field: string,
    value: any,
  ) => void;
}

type Props = DropDownControlProps & ReduxDispatchProps;

const mapStateToProps = (
  state: AppState,
  ownProps: DropDownControlProps,
): {
  isLoading: boolean;
  options: SelectOptionProps[];
  formValues: Partial<Action>;
} => {
  // Added default options to prevent error when options is undefined
  let isLoading = false;
  let options = ownProps.fetchOptionsConditionally ? [] : ownProps.options;
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

// Connecting this component to the state to allow for dynamic fetching of options to be updated.
export default connect(mapStateToProps, mapDispatchToProps)(DropDownControl);
