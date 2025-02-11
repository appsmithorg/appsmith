import React from "react";
import memoizeOne from "memoize-one";
import { get, isEmpty, isNil, uniqBy } from "lodash";
import {
  Field,
  change,
  getFormValues,
  type WrappedFieldInputProps,
  type WrappedFieldMetaProps,
} from "redux-form";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import {
  FormDataPaths,
  matchExact,
  MATCH_ACTION_CONFIG_PROPERTY,
} from "workers/Evaluation/formEval";
import type { Action } from "entities/Action";
import type { SelectOptionProps } from "@appsmith/ads";
import { Icon, Option, OptGroup, Select } from "@appsmith/ads";
import { getFormConfigConditionalOutput } from "selectors/formSelectors";
import { fetchFormDynamicValNextPage } from "actions/evaluationActions";
import { objectKeys } from "@appsmith/utils";
import type {
  ConditionalOutput,
  DynamicValues,
} from "reducers/evaluationReducers/formEvaluationReducer";

/**
 * Interface for grouped dropdown options with label and children
 * @interface DropDownGroupedOptionsInterface
 * @property {string} label - Display label for the option group
 * @property {SelectOptionProps[]} children - Array of options within this group
 */
export interface DropDownGroupedOptionsInterface {
  label: string;
  children: SelectOptionProps[];
}

/**
 * Groups dropdown options based on provided configuration
 * The grouping is only done if the optionGroupConfig is provided
 * The default group is "others" if not provided
 * @param {SelectOptionProps[]} options - Array of options to be grouped
 * @param {Record<string, DropDownGroupedOptionsInterface>} [optionGroupConfig] - Configuration for grouping options
 * @returns {DropDownGroupedOptionsInterface[] | null} Grouped options array or null if no grouping needed
 */
function buildGroupedOptions(
  options: SelectOptionProps[],
  optionGroupConfig?: Record<string, DropDownGroupedOptionsInterface>,
): DropDownGroupedOptionsInterface[] | null {
  if (!optionGroupConfig) return null;

  const defaultGroupKey = "others";
  const defaultGroupConfig: DropDownGroupedOptionsInterface = {
    label: "Others",
    children: [],
  };

  // Copy group config so we don't mutate the original
  const groupMap = { ...optionGroupConfig };

  // Re-initialize every group's children to an empty array
  objectKeys(groupMap).forEach((key) => {
    groupMap[key] = { ...groupMap[key], children: [] };
  });

  // Ensure we have an "others" group
  if (!Object.hasOwn(groupMap, defaultGroupKey)) {
    groupMap[defaultGroupKey] = { ...defaultGroupConfig };
  } else {
    // Re-initialize "others" group's children to an empty array
    groupMap[defaultGroupKey] = { ...groupMap[defaultGroupKey], children: [] };
  }

  // Distribute each option to the correct group
  options.forEach((opt) => {
    const groupKey =
      Object.hasOwn(opt, "optionGroupType") && opt.optionGroupType
        ? opt.optionGroupType
        : defaultGroupKey;

    // If the groupKey doesn't exist in config, fall back to "others"
    if (!Object.hasOwn(groupMap, groupKey)) {
      groupMap[defaultGroupKey].children.push(opt);

      return;
    }

    groupMap[groupKey].children.push(opt);
  });

  // Return only groups that actually have children
  const grouped: DropDownGroupedOptionsInterface[] = [];

  objectKeys(groupMap).forEach((key) => {
    const group = groupMap[key];

    if (group.children.length > 0) grouped.push(group);
  });

  return grouped;
}

/**
 * Memoized version of buildGroupedOptions for performance
 */
const memoizedBuildGroupedOptions = memoizeOne(buildGroupedOptions);

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
    value: unknown,
  ) => void;
  fetchFormTriggerNextPage: (paginationPayload: {
    value: ConditionalOutput;
    dynamicFetchedValues: DynamicValues;
    actionId: string;
    datasourceId: string;
    pluginId: string;
    identifier: string;
  }) => void;
}

type Props = DropDownControlProps & ReduxDispatchProps;

/**
 * Main dropdown control component supporting single/multi select functionality
 * @class DropDownControl
 * @extends {BaseControl<Props>}
 */
class DropDownControl extends BaseControl<Props> {
  componentDidUpdate(prevProps: Props) {
    // If dependencies changed in multi-select, reset values
    if (this.props.fetchOptionsConditionally && this.props.isMultiSelect) {
      const dependencies = matchExact(
        MATCH_ACTION_CONFIG_PROPERTY,
        this.props.conditionals?.fetchDynamicValues?.condition,
      );
      let hasDependenciesChanged = false;

      if (dependencies?.length) {
        dependencies.forEach((depPath) => {
          const prevValue = get(prevProps.formValues, depPath);
          const currValue = get(this.props.formValues, depPath);

          if (prevValue !== currValue) hasDependenciesChanged = true;
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

    // Clear entity type if the command changed
    if (this.props.configProperty === FormDataPaths.ENTITY_TYPE) {
      const prevCommandValue = get(prevProps.formValues, FormDataPaths.COMMAND);
      const currCommandValue = get(
        this.props.formValues,
        FormDataPaths.COMMAND,
      );

      if (prevCommandValue !== currCommandValue) {
        this.props.updateConfigPropertyValue(
          this.props.formName,
          this.props.configProperty,
          "",
        );
      }
    }
  }

  getControlType(): ControlType {
    return "DROP_DOWN";
  }

  render() {
    const styles = {
      ...("customStyles" in this.props &&
      typeof this.props.customStyles === "object"
        ? this.props.customStyles
        : {}),
    };

    return (
      <div
        className={`t--${this.props.configProperty} uqi-dropdown-select`}
        data-testid={this.props.configProperty}
        style={styles}
      >
        <Field
          component={renderDropdown}
          name={this.props.configProperty}
          props={{ ...this.props, width: styles.width }}
          type={this.props.isMultiSelect ? "select-multiple" : undefined}
        />
      </div>
    );
  }
}

/**
 * Renders the dropdown field component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered dropdown component
 */
function renderDropdown(
  props: {
    input?: {
      value?: string | string[];
      onChange: (val: string | string[]) => void;
    } & WrappedFieldInputProps;
    meta?: Partial<WrappedFieldMetaProps>;
    width: string;
  } & DropDownControlProps &
    ReduxDispatchProps,
): JSX.Element {
  const { input, isMultiSelect, optionGroupConfig, options = [] } = props;
  // Safeguard the selectedValue (since it might be empty, null, or a string/string[])
  let selectedValue = input?.value;

  // If no selectedValue, use `initialValue` or set to empty array/string
  if (isEmpty(selectedValue)) {
    if (isMultiSelect) {
      selectedValue = props.initialValue ? (props.initialValue as string) : [];
    } else {
      selectedValue = props.initialValue
        ? (props.initialValue as string[])
        : "";

      // If user wants the first option as default
      if (props.setFirstOptionAsDefault && options.length > 0) {
        selectedValue = options[0].value as string;
        input?.onChange(selectedValue);
      }
    }
  }

  // If multi-select but we have a string, convert it to an array
  if (isMultiSelect && !Array.isArray(selectedValue)) {
    selectedValue = [selectedValue];
  }

  // Deduplicate if multi-select
  if (isMultiSelect && Array.isArray(selectedValue)) {
    // If your items have stable 'value' keys, use `uniqBy(...)`.
    // For pure strings you can do `uniq([...selectedValue])`.
    selectedValue = uniqBy(selectedValue, (v) => v);
  }

  // Identify which items are actually selected
  const selectedOptions = options.filter((opt) =>
    isMultiSelect
      ? (selectedValue as string[]).includes(opt.value as string)
      : selectedValue === opt.value,
  );

  // Use memoized grouping
  const groupedOptions = memoizedBuildGroupedOptions(
    options,
    optionGroupConfig,
  );

  // Re-sync multi-select if stale
  if (isMultiSelect && Array.isArray(selectedValue)) {
    const validValues = selectedOptions.map((so) => so.value);

    if (validValues.length !== selectedValue.length) {
      input?.onChange(validValues);
    }
  }

  // Re-sync single-select if stale
  if (!isMultiSelect && selectedOptions.length) {
    const singleVal = selectedOptions[0].value;

    if (singleVal !== selectedValue) {
      input?.onChange(singleVal);
    }
  }

  // If required but the chosen single value is disabled, pick first enabled
  if (
    !isMultiSelect &&
    props.isRequired &&
    options.some((opt) => "disabled" in opt)
  ) {
    const isCurrentOptionDisabled = options.some(
      (opt) => opt.value === selectedValue && opt.disabled,
    );

    if (isCurrentOptionDisabled) {
      const firstEnabled = options.find((opt) => !opt.disabled);

      if (firstEnabled) {
        input?.onChange(firstEnabled.value);
      }
    }
  }

  /**
   * Handles the selection of options
   * If multi select is enabled, we need to add the value to the current array
   * If multi select is not enabled, we just set the value
   * @param {string | undefined} value - The selected value
   */
  function onSelectOptions(value: string | undefined) {
    if (isNil(value)) return;

    if (!isMultiSelect) {
      input?.onChange(value);

      return;
    }

    const currentArray = Array.isArray(selectedValue) ? [...selectedValue] : [];

    if (!currentArray.includes(value)) currentArray.push(value);

    input?.onChange(currentArray);
  }

  /**
   * Handles the removal of options
   * If multi select is enabled, we need to remove the value from the current array
   * If multi select is not enabled, we just set the value to an empty string
   * @param {string | undefined} value - The value to remove
   */
  function onRemoveOptions(value: string | undefined) {
    if (isNil(value)) return;

    if (!isMultiSelect) {
      input?.onChange("");

      return;
    }

    const currentArray = Array.isArray(selectedValue) ? [...selectedValue] : [];
    const filtered = currentArray.filter((v) => v !== value);

    input?.onChange(filtered);
  }

  /**
   * Clears all options
   * If multi select is enabled, we need to set the value to an empty array
   * If multi select is not enabled, we just set the value to an empty string
   */
  function clearAllOptions() {
    if (isNil(selectedValue)) return;

    if (isMultiSelect) {
      input?.onChange([]);
    } else {
      input?.onChange("");
    }
  }

  /**
   * Subscribes to the scroll event of the popup and notifies when end of scroll is reached
   * If pagination is needed and there is a payload, we need to fetch the next page on end of scroll
   * @param {React.UIEvent<HTMLDivElement>} e - The event object
   */
  function handlePopupScroll(e: React.UIEvent<HTMLDivElement>) {
    if (!props.nextPageNeeded || !props.paginationPayload) return;

    const target = e.currentTarget;

    if (target.scrollHeight - target.scrollTop === target.clientHeight) {
      props.fetchFormTriggerNextPage(props.paginationPayload);
    }
  }

  /* ---------------------------------------------------
     Rendering the final <Select />
     --------------------------------------------------- */
  return (
    <Select
      allowClear={isMultiSelect && !isEmpty(selectedValue)}
      data-testid={`t--dropdown-${props.configProperty}`}
      defaultValue={props.initialValue}
      isDisabled={props.disabled}
      isLoading={props.isLoading}
      isMultiSelect={isMultiSelect}
      onClear={clearAllOptions}
      onDeselect={onRemoveOptions}
      onPopupScroll={handlePopupScroll}
      onSelect={onSelectOptions}
      placeholder={props.placeholderText}
      showSearch={props.isSearchable}
      value={isMultiSelect ? selectedOptions : selectedOptions[0]}
    >
      {groupedOptions
        ? groupedOptions.map(({ children, label }) => (
            <OptGroup aria-label={label} key={label}>
              {children.map(renderOptionWithIcon)}
            </OptGroup>
          ))
        : options.map(renderOptionWithIcon)}
    </Select>
  );
}

/**
 * Renders a single option with optional icon
 * @param {SelectOptionProps} option - Option configuration
 * @returns {JSX.Element} Rendered option component
 */
function renderOptionWithIcon(option: SelectOptionProps) {
  return (
    <Option
      aria-label={option.label}
      disabled={option.disabled}
      isDisabled={option.isDisabled}
      key={option.value}
      value={option.value}
    >
      {option.icon && <Icon color={option.color} name={option.icon} />}
      {option.label}
    </Option>
  );
}

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
  let isLoading = false;
  // Start with the user-provided options if not fetching conditionally
  let options = ownProps.fetchOptionsConditionally ? [] : ownProps.options;
  const formValues: Partial<Action> = getFormValues(ownProps.formName)(state);

  let nextPageNeeded = false;
  let paginationPayload;

  try {
    if (ownProps.fetchOptionsConditionally) {
      const conditionalOutput = getFormConfigConditionalOutput(state, ownProps);
      const dynamicFetchedValues =
        conditionalOutput.fetchDynamicValues || ({} as DynamicValues);

      const { data } = dynamicFetchedValues;

      if (data && data.content && data.startIndex != null) {
        // e.g. content, count, startIndex, total
        const { content, count, startIndex, total } = data;

        // Possibly deduplicate with existing options:
        // e.g. options = deduplicate([...options, ...content]);
        options = content;

        if (startIndex + count < total) {
          nextPageNeeded = true;
          // Prepare the next page request
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
        // No pagination, so just use the fetched data
        options = dynamicFetchedValues.data || [];
      }

      isLoading = dynamicFetchedValues.isLoading;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return {
    isLoading,
    options,
    formValues,
    nextPageNeeded,
    paginationPayload,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateConfigPropertyValue: (formName: string, field: string, value: any) => {
    dispatch(change(formName, field, value));
  },
  fetchFormTriggerNextPage: (paginationPayload?: {
    value: ConditionalOutput;
    dynamicFetchedValues: DynamicValues;
    actionId: string;
    datasourceId: string;
    pluginId: string;
    identifier: string;
  }) => {
    dispatch(fetchFormDynamicValNextPage(paginationPayload));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(DropDownControl);