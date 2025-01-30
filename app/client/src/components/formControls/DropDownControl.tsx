import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import { get, isEmpty, isNil } from "lodash";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
import { getFormConfigConditionalOutput } from "selectors/formSelectors";
import { change, getFormValues } from "redux-form";
import {
  FormDataPaths,
  matchExact,
  MATCH_ACTION_CONFIG_PROPERTY,
} from "workers/Evaluation/formEval";
import type { Action } from "entities/Action";
import type { SelectOptionProps } from "@appsmith/ads";
import { Icon, Option, OptGroup, Select } from "@appsmith/ads";
import { objectKeys } from "@appsmith/utils";
import { fetchFormDynamicValNextPage } from "actions/evaluationActions";
import type {
  ConditionalOutput,
  DynamicValues,
} from "reducers/evaluationReducers/formEvaluationReducer";

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
      <div
        className={`t--${this?.props?.configProperty} uqi-dropdown-select`}
        data-testid={this.props.configProperty}
        style={styles}
      >
        <Field
          component={renderDropdown}
          name={this.props.configProperty}
          props={{ ...this.props, width: styles.width }}
          type={this.props?.isMultiSelect ? "select-multiple" : undefined}
        />
      </div>
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
  } & DropDownControlProps &
    ReduxDispatchProps,
): JSX.Element {
  let selectedValue: string | string[];

  if (isEmpty(props.input?.value)) {
    if (props.isMultiSelect)
      selectedValue = props?.initialValue ? (props.initialValue as string) : [];
    else {
      selectedValue = props?.initialValue
        ? (props.initialValue as string[])
        : "";

      if (props.setFirstOptionAsDefault && props.options.length > 0) {
        selectedValue = props.options[0].value as string;
        props.input?.onChange(selectedValue);
      }
    }
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
  let optionGroupConfig: Record<string, DropDownGroupedOptionsInterface> = {};
  let groupedOptions: DropDownGroupedOptionsInterface[] = [];
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

  const defaultOptionGroupType = "others";
  const defaultOptionGroupConfig: DropDownGroupedOptionsInterface = {
    label: "Others",
    children: [],
  };

  // For grouping, 2 components are needed
  // 1) optionGroupConfig: used to render the label text and allows for future expansions
  // related to UI of the group label
  // 2) each option should mention a optionGroupType which will help to group the option inside
  // the group. If not present or the type is not defined in the optionGroupConfig then it will be
  // added to the default group mentioned above.
  if (
    !!props.optionGroupConfig &&
    typeof props.optionGroupConfig === "object"
  ) {
    optionGroupConfig = props.optionGroupConfig;
    options.forEach((opt) => {
      let optionGroupType = defaultOptionGroupType;
      let groupConfig: DropDownGroupedOptionsInterface;

      if (Object.hasOwn(opt, "optionGroupType") && !!opt.optionGroupType) {
        optionGroupType = opt.optionGroupType;
      }

      if (Object.hasOwn(optionGroupConfig, optionGroupType)) {
        groupConfig = optionGroupConfig[optionGroupType];
      } else {
        // if optionGroupType is not defined in optionGroupConfig
        // use the default group config
        groupConfig = defaultOptionGroupConfig;
      }

      const groupChildren = groupConfig?.children || [];

      groupChildren.push(opt);
      groupConfig["children"] = groupChildren;
      optionGroupConfig[optionGroupType] = groupConfig;
    });

    groupedOptions = [];
    objectKeys(optionGroupConfig).forEach(
      (key) =>
        optionGroupConfig[key].children.length > 0 &&
        groupedOptions.push(optionGroupConfig[key]),
    );
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

  const clearAllOptions = () => {
    if (!isNil(selectedValue)) {
      if (props.isMultiSelect) {
        if (Array.isArray(selectedValue)) {
          selectedValue = [];
          props.input?.onChange([]);
        }
      } else {
        selectedValue = "";
        props.input?.onChange("");
      }
    }
  };

  if (options.length > 0) {
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
          const firstEnabledOption = options.find((opt) => !opt?.disabled);

          if (firstEnabledOption) {
            selectedValue = firstEnabledOption?.value as string;
            props.input?.onChange(firstEnabledOption?.value);
          }
        }
      }
    }
  }

  function handlePopupScroll(e: React.UIEvent<HTMLDivElement>) {
    if (!props.nextPageNeeded) return;

    const target = e.target as HTMLDivElement;

    if (target.scrollHeight - target.scrollTop === target.clientHeight) {
      props.fetchFormTriggerNextPage(props.paginationPayload);
    }
  }

  return (
    <Select
      allowClear={props.isMultiSelect && !isEmpty(selectedValue)}
      data-testid={`t--dropdown-${props?.configProperty}`}
      defaultValue={props.initialValue}
      isDisabled={props.disabled}
      isLoading={props.isLoading}
      isMultiSelect={props?.isMultiSelect}
      onClear={clearAllOptions}
      onDeselect={onRemoveOptions}
      onPopupScroll={handlePopupScroll}
      onSelect={(value) => onSelectOptions(value)}
      placeholder={props?.placeholderText}
      showSearch={props.isSearchable}
      value={props.isMultiSelect ? selectedOptions : selectedOptions[0]}
    >
      {groupedOptions.length === 0
        ? options.map(renderOptionWithIcon)
        : groupedOptions.map(({ children, label }) => {
            return (
              <OptGroup aria-label={label} key={label}>
                {children.map(renderOptionWithIcon)}
              </OptGroup>
            );
          })}
    </Select>
  );
}

function renderOptionWithIcon(option: SelectOptionProps) {
  return (
    <Option
      aria-label={option.label}
      disabled={option.disabled}
      isDisabled={option.isDisabled}
      value={option.value}
    >
      {option.icon && <Icon color={option.color} name={option.icon} />}
      {option.label}
    </Option>
  );
}

export interface DropDownGroupedOptionsInterface {
  label: string;
  children: SelectOptionProps[];
}

export interface DropDownControlProps extends ControlProps {
  options: SelectOptionProps[];
  optionGroupConfig?: Record<string, DropDownGroupedOptionsInterface>;
  optionWidth?: string;
  placeholderText: string;
  propertyValue: string;
  subtitle?: string;
  isMultiSelect?: boolean;
  isSearchable?: boolean;
  fetchOptionsConditionally?: boolean;
  isLoading: boolean;
  formValues: Partial<Action>;
  setFirstOptionAsDefault?: boolean;
  nextPageNeeded?: boolean;
  paginationPayload?: {
    value: ConditionalOutput;
    dynamicFetchedValues: DynamicValues;
    actionId: string;
    datasourceId: string;
    pluginId: string;
    identifier: string;
  };
}

interface ReduxDispatchProps {
  updateConfigPropertyValue: (
    formName: string,
    field: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
  ) => void;
  fetchFormTriggerNextPage: (paginationPayload?: {
    value: ConditionalOutput;
    dynamicFetchedValues: DynamicValues;
    actionId: string;
    datasourceId: string;
    pluginId: string;
    identifier: string;
  }) => void;
}

type Props = DropDownControlProps & ReduxDispatchProps;

const mapStateToProps = (
  state: AppState,
  ownProps: DropDownControlProps,
): {
  isLoading: boolean;
  options: SelectOptionProps[];
  formValues: Partial<Action>;
  nextPageNeeded: boolean;
  paginationPayload?: {
    value: ConditionalOutput;
    dynamicFetchedValues: DynamicValues;
    actionId: string;
    datasourceId: string;
    pluginId: string;
    identifier: string;
  };
} => {
  // Added default options to prevent error when options is undefined
  let isLoading = false;
  let options = ownProps.fetchOptionsConditionally ? [] : ownProps.options;
  const formValues: Partial<Action> = getFormValues(ownProps.formName)(state);
  let conditionalOutput: ConditionalOutput;
  let nextPageNeeded = false;
  let paginationPayload;

  try {
    if (ownProps.fetchOptionsConditionally) {
      conditionalOutput = getFormConfigConditionalOutput(state, ownProps);
      const dynamicFetchedValues = !!conditionalOutput.fetchDynamicValues
        ? conditionalOutput.fetchDynamicValues
        : ({} as DynamicValues);

      const { data } = dynamicFetchedValues;

      if (data.hasOwnProperty("content") && data.hasOwnProperty("startIndex")) {
        //isResponsePaginated = true;
        const { content, count, startIndex, total } = data;

        options = content;

        if (startIndex + count < total) {
          // next page is needed
          nextPageNeeded = true;

          const modifiedDFV: DynamicValues = {
            ...dynamicFetchedValues,
            evaluatedConfig: {
              ...dynamicFetchedValues.evaluatedConfig,
              params: {
                ...dynamicFetchedValues.evaluatedConfig.params,
                parameters: {
                  ...dynamicFetchedValues.evaluatedConfig.params.parameters,
                  startIndex: startIndex + count,
                },
              },
            },
          };

          paginationPayload = {
            value: { ...conditionalOutput, fetchDynamicValues: modifiedDFV },
            dynamicFetchedValues: modifiedDFV,
            actionId: formValues.id || "",
            datasourceId: formValues.datasource?.id || "",
            pluginId: formValues.pluginId || "",
            identifier:
              ownProps.propertyName ||
              ownProps.configProperty ||
              ownProps.identifier ||
              "",
          };
        }
      } else {
        options = dynamicFetchedValues.data;
      }

      isLoading = dynamicFetchedValues.isLoading;
    }
  } catch (e) {
    // Printing error to console
    // eslint-disable-next-line no-console
    console.error(e);
  } finally {
    return {
      isLoading,
      options,
      formValues,
      nextPageNeeded,
      paginationPayload,
    };
  }
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateConfigPropertyValue: (formName: string, field: string, value: any) => {
    dispatch(change(formName, field, value));
  },
  fetchFormTriggerNextPage: (paginationPayload) => {
    dispatch(fetchFormDynamicValNextPage(paginationPayload));
  },
});

// Connecting this component to the state to allow for dynamic fetching of options to be updated.
export default connect(mapStateToProps, mapDispatchToProps)(DropDownControl);
