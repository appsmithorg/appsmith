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
import { Icon, Option, OptGroup, Select, Flex, Text } from "@appsmith/ads";
import { getFormConfigConditionalOutput } from "selectors/formSelectors";
import { fetchFormDynamicValNextPage } from "actions/evaluationActions";
import { objectKeys } from "@appsmith/utils";
import type {
  ConditionalOutput,
  DynamicValues,
} from "reducers/evaluationReducers/formEvaluationReducer";
import NoSearchCommandFound from "./CustomActionsConfigControl/NoSearchCommandFound";
import styled from "styled-components";

const OptionLabel = styled(Text)`
  color: var(--ads-v2-color-fg);
  font-size: 14px;
  font-weight: 500;
`;

const OptionSubText = styled(Text)`
  color: var(--ads-v2-color-fg-muted);
  font-size: 12px;
`;

export interface DropDownGroupedOptions {
  label: string;
  children: SelectOptionProps[];
}

/**
 * Groups dropdown options based on provided configuration
 * The grouping is only done if the optionGroupConfig is provided
 * The default group is "others" if not provided
 * @param {SelectOptionProps[]} options - Array of options to be grouped
 * @param {Record<string, DropDownGroupedOptions>} [optionGroupConfig] - Configuration for grouping options
 * @returns {DropDownGroupedOptions[] | null} Grouped options array or null if no grouping needed
 */
function buildGroupedOptions(
  options: SelectOptionProps[],
  optionGroupConfig?: Record<string, DropDownGroupedOptions>,
): DropDownGroupedOptions[] | null {
  if (!optionGroupConfig) return null;

  const defaultGroupKey = "others";
  const defaultGroupConfig: DropDownGroupedOptions = {
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
  const grouped: DropDownGroupedOptions[] = [];

  objectKeys(groupMap).forEach((key) => {
    const group = groupMap[key];

    if (group.children.length > 0) grouped.push(group);
  });

  return grouped;
}

const memoizedBuildGroupedOptions = memoizeOne(buildGroupedOptions);

export interface DropDownControlProps extends ControlProps {
  options: SelectOptionProps[];
  optionGroupConfig?: Record<string, DropDownGroupedOptions>;
  optionWidth?: string;
  maxTagCount?: number;
  placeholderText: string;
  propertyValue: string;
  subtitle?: string;
  isMultiSelect?: boolean;
  isAllowClear?: boolean;
  isSearchable?: boolean;
  fetchOptionsConditionally?: boolean;
  isLoading: boolean;
  formValues: Partial<Action>;
  setFirstOptionAsDefault?: boolean;
  nextPageNeeded?: boolean;
  appendGroupIdentifierToValue?: boolean;
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
 * Renders a dropdown component with support for single and multi-select.
 * Handles initialization of selected values, including:
 * - Using initialValue prop if no value is selected
 * - Converting string values to arrays for multi-select
 * - Setting first option as default if configured
 * - Deduplicating selected values in multi-select mode
 * Supports pagination through onPopupScroll handler when nextPageNeeded
 * and paginationPayload props are provided
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
  const {
    appendGroupIdentifierToValue,
    input,
    isAllowClear,
    isMultiSelect,
    optionGroupConfig,
    options = [],
    setFirstOptionAsDefault,
  } = props;
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
      if (setFirstOptionAsDefault && options.length > 0) {
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

  // Use memoized grouping
  const groupedOptions = memoizedBuildGroupedOptions(
    options,
    optionGroupConfig,
  );

  // Find the selected options based on the selectedValue
  // If appendGroupIdentifierToValue is true, we need to check if the selected value includes the group identifier
  // Eg: if the selected value is "group1:1", we need to find the option with value "1"
  // If appendGroupIdentifierToValue is false, we just need to find the option with value "1"
  const selectedOptions = options.filter((opt) => {
    const checkGroupIdentifier =
      appendGroupIdentifierToValue && optionGroupConfig;
    const valueToCompare = checkGroupIdentifier
      ? opt.optionGroupType + ":" + opt.value
      : opt.value;

    return isMultiSelect
      ? (selectedValue as string[]).includes(valueToCompare)
      : selectedValue === valueToCompare;
  });

  // Re-sync multi-select if stale
  if (isMultiSelect && Array.isArray(selectedValue)) {
    const validValues = selectedOptions.map((so) => so.value);

    if (
      !appendGroupIdentifierToValue &&
      validValues.length !== selectedValue.length
    ) {
      input?.onChange(validValues);
    }
  }

  // Re-sync single-select if stale
  if (!isMultiSelect && selectedOptions.length) {
    const singleVal = selectedOptions[0].value;

    if (!appendGroupIdentifierToValue && singleVal !== selectedValue) {
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
   * If appendGroupIdentifierToValue is true, we need to add the group identifier to the value
   * Eg: if the selected value is "1" of "group1", we need to add "group1:1" to the current array
   * @param {string | undefined} optionValueToSelect - The selected value
   */
  function onSelectOptions(optionValueToSelect: string | undefined) {
    if (isNil(optionValueToSelect)) return;

    // If appendGroupIdentifierToValue is true and we have grouped options, add the group identifier
    const shouldAppendGroup = appendGroupIdentifierToValue && optionGroupConfig;
    let valueToStore = optionValueToSelect;

    if (shouldAppendGroup) {
      const selectedOption = options.find(
        (opt) => opt.value === optionValueToSelect,
      );

      if (selectedOption) {
        valueToStore = `${selectedOption.optionGroupType || "others"}:${optionValueToSelect}`;
      }
    }

    if (!isMultiSelect) {
      input?.onChange(valueToStore);

      return;
    }

    // In case the component config is changed to multi-select, we need to convert the selectedValue to an array
    const currentArray = Array.isArray(selectedValue) ? [...selectedValue] : [];

    if (!currentArray.includes(valueToStore)) {
      currentArray.push(valueToStore);
    }

    input?.onChange(currentArray);
  }

  /**
   * Handles the removal of options
   * If multi select is enabled, we need to remove the value from the current array
   * If multi select is not enabled, we just set the value to an empty string
   * If appendGroupIdentifierToValue is true, we need to check the value with the group identifier
   * Eg: the function will be called with "1" and the current array is ["group1:1", "others:2"]
   * We need to check if "1" is present in the array after removing the group identifier
   * The function will return ["others:2"]
   * @param {string | undefined} optionValueToRemove - The value to remove
   */
  function onRemoveOptions(optionValueToRemove: string | undefined) {
    if (isNil(optionValueToRemove)) return;

    if (!isMultiSelect) {
      input?.onChange("");

      return;
    }

    const currentArray = Array.isArray(selectedValue) ? [...selectedValue] : [];

    const filtered = currentArray.filter((v) => {
      let selectedValueToCheck = v;

      if (appendGroupIdentifierToValue && optionGroupConfig) {
        // For grouped values, we need to compare just the value part after the group identifier
        selectedValueToCheck = v.split(":")[1];
      }

      return selectedValueToCheck !== optionValueToRemove;
    });

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

  return (
    <Select
      allowClear={(isMultiSelect || isAllowClear) && !isEmpty(selectedValue)}
      data-testid={`t--dropdown-${props.configProperty}`}
      defaultValue={props.initialValue}
      isDisabled={props.disabled}
      isLoading={props.isLoading}
      isMultiSelect={isMultiSelect}
      listHeight={240}
      maxTagCount={props.maxTagCount}
      notFoundContent={
        <NoSearchCommandFound
          configProperty={props.configProperty}
          onSelectOptions={onSelectOptions}
          options={options}
          pluginId={get(props.formValues, "pluginId")}
        />
      }
      onClear={clearAllOptions}
      onDeselect={onRemoveOptions}
      onPopupScroll={handlePopupScroll}
      onSelect={onSelectOptions}
      // Default value of optionFilterProp prop is `value` which searches the dropdown based on value and not label,
      // hence explicitly setting this to label to search based on label.
      // For eg. If value is `Create_ticket` and label is `Create ticket`, we should be able to search using `Create ticket`.
      optionFilterProp="label"
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

function renderOptionWithIcon(option: SelectOptionProps) {
  return option.subText ? (
    <Option
      aria-label={option.label}
      disabled={option.disabled}
      isDisabled={option.isDisabled}
      key={option.value}
      label={option.label}
      value={option.value}
    >
      <Flex flexDirection="column">
        <Flex>
          {option.icon && <Icon color={option.color} name={option.icon} />}
          <OptionLabel data-testid={`t--label-${option.label}`}>
            {option.label}
          </OptionLabel>
        </Flex>
        <OptionSubText>{option.subText}</OptionSubText>
      </Flex>
    </Option>
  ) : (
    <Option
      aria-label={option.label}
      disabled={option.disabled}
      isDisabled={option.isDisabled}
      key={option.value}
      label={option.label}
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
        const { content, count, startIndex, total } = data;

        options = content;

        if (startIndex + count < total) {
          nextPageNeeded = true;

          // Prepare the next page request
          const modifiedParams = {
            ...dynamicFetchedValues.evaluatedConfig.params,
            parameters: {
              ...dynamicFetchedValues.evaluatedConfig.params.parameters,
              startIndex: startIndex + count,
            },
          };

          const modifiedDFV: DynamicValues = {
            ...dynamicFetchedValues,
            evaluatedConfig: {
              ...dynamicFetchedValues.evaluatedConfig,
              params: modifiedParams,
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
