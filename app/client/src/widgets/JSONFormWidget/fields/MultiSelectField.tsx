import React, { useCallback, useContext, useMemo, useState } from "react";
import styled from "styled-components";
import {
  DefaultValueType,
  LabelValueType,
} from "rc-select/lib/interface/generator";
import { useController } from "react-hook-form";

import Field from "../component/Field";
import FormContext from "../FormContext";
import MultiSelect from "widgets/MultiSelectWidgetV2/component";
import useDeepEffect from "utils/hooks/useDeepEffect";
import useEvents from "./useEvents";
import useRegisterFieldValidity from "./useRegisterFieldInvalid";
import useUpdateInternalMetaState from "./useUpdateInternalMetaState";
import { Layers } from "constants/Layers";
import {
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  FieldEventProps,
} from "../constants";
import { DropdownOption } from "widgets/MultiSelectTreeWidget/widget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { isPrimitive, validateOptions } from "../helper";

type MultiSelectComponentProps = FieldComponentBaseProps &
  FieldEventProps & {
    allowSelectAll?: boolean;
    defaultValue?: string[];
    isFilterable: boolean;
    onFilterChange?: string;
    onFilterUpdate?: string;
    onOptionChange?: string;
    options: DropdownOption[];
    placeholderText?: string;
    serverSideFiltering: boolean;
  };

export type MultiSelectFieldProps = BaseFieldComponentProps<
  MultiSelectComponentProps
>;

const COMPONENT_DEFAULT_VALUES: MultiSelectComponentProps = {
  isDisabled: false,
  isFilterable: false,
  isRequired: false,
  isVisible: true,
  label: "",
  serverSideFiltering: false,
  options: [
    { label: "Blue", value: "BLUE" },
    { label: "Green", value: "GREEN" },
    { label: "Red", value: "RED" },
  ],
};

const StyledMultiSelectWrapper = styled.div`
  width: 100%;
`;

const isValid = (schemaItem: MultiSelectFieldProps["schemaItem"], value = []) =>
  schemaItem.isRequired ? Boolean(value.length) : true;

const defaultValueValidator = (value: any) => {
  if (!Array.isArray(value)) return false;
  if (!value.every((v) => typeof v === "string")) return false;

  return true;
};

const DEFAULT_DROPDOWN_STYLES = {
  zIndex: Layers.dropdownModalWidget,
};

const fieldValuesToComponentValues = (
  values: LabelValueType["value"][],
  options: LabelValueType[] = [],
) => {
  return values.map((value) => {
    const option = options.find((option) => option.value === value);

    if (option) return option;
    return { value, label: value };
  });
};

const componentValuesToFieldValues = (componentValues: LabelValueType[] = []) =>
  componentValues.map(({ value }) => value);

function MultiSelectField({
  fieldClassName,
  name,
  passedDefaultValue,
  schemaItem,
}: MultiSelectFieldProps) {
  const {
    fieldType,
    isRequired,
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;
  const { executeAction, updateWidgetMetaProperty } = useContext(FormContext);
  const [filterText, setFilterText] = useState<string>();
  const [componentValues, setComponentValues] = useState<LabelValueType[]>([]);

  const {
    field: { onBlur, onChange, value },
    fieldState: { isDirty },
  } = useController({
    name,
    shouldUnregister: true,
  });

  const { onBlurHandler, onFocusHandler } = useEvents<HTMLInputElement>({
    fieldBlurHandler: onBlur,
    onFocusDynamicString,
    onBlurDynamicString,
  });

  const isValueValid = isValid(schemaItem, value);

  useRegisterFieldValidity({
    isValid: isValueValid,
    fieldName: name,
    fieldType,
  });

  useUpdateInternalMetaState({
    propertyName: `${name}.filterText`,
    propertyValue: filterText,
  });

  const { componentDefaultValue, fieldDefaultValue } = useMemo(() => {
    let componentDefaultValue: LabelValueType[] = [];
    let fieldDefaultValue: LabelValueType["value"][] = [];
    const values:
      | LabelValueType["value"][]
      | LabelValueType[] = validateOptions(passedDefaultValue)
      ? schemaItem.defaultValue ||
        (passedDefaultValue as LabelValueType[]) ||
        []
      : schemaItem.defaultValue || [];

    if (values.length && isPrimitive(values[0])) {
      fieldDefaultValue = values as LabelValueType["value"][];
      componentDefaultValue = fieldValuesToComponentValues(
        fieldDefaultValue,
        schemaItem.options,
      );
    } else {
      componentDefaultValue = values as LabelValueType[];
      fieldDefaultValue = componentValuesToFieldValues(componentDefaultValue);
    }

    return {
      componentDefaultValue,
      fieldDefaultValue,
    };
  }, [schemaItem.defaultValue, passedDefaultValue]);

  useDeepEffect(() => {
    setComponentValues(componentDefaultValue);
  }, [componentDefaultValue]);

  const onFilterChange = useCallback(
    (value: string) => {
      setFilterText(value);

      if (schemaItem.onFilterUpdate) {
        executeAction({
          triggerPropertyName: "onFilterUpdate",
          dynamicString: schemaItem.onFilterUpdate,
          event: {
            type: EventType.ON_FILTER_UPDATE,
          },
        });
      }
    },
    [updateWidgetMetaProperty, executeAction, schemaItem.onFilterUpdate],
  );

  const onOptionChange = useCallback(
    (values: DefaultValueType) => {
      setComponentValues(values as LabelValueType[]);

      onChange(componentValuesToFieldValues(values as LabelValueType[]));

      if (schemaItem.onOptionChange && executeAction) {
        executeAction({
          triggerPropertyName: "onOptionChange",
          dynamicString: schemaItem.onOptionChange,
          event: {
            type: EventType.ON_OPTION_CHANGE,
          },
        });
      }
    },
    [executeAction, schemaItem.onOptionChange],
  );

  const fieldComponent = useMemo(() => {
    return (
      <StyledMultiSelectWrapper>
        <MultiSelect
          allowSelectAll={schemaItem.allowSelectAll}
          compactMode={false}
          disabled={schemaItem.isDisabled}
          dropDownWidth={90}
          dropdownStyle={DEFAULT_DROPDOWN_STYLES}
          filterText={filterText}
          isFilterable={schemaItem.isFilterable}
          isValid={isDirty ? isValueValid : true}
          loading={false}
          onBlur={onBlurHandler}
          onChange={onOptionChange}
          onFilterChange={onFilterChange}
          onFocus={onFocusHandler}
          options={schemaItem.options || []}
          placeholder={schemaItem.placeholderText || ""}
          serverSideFiltering={schemaItem.serverSideFiltering}
          value={componentValues}
          widgetId={name}
          width={100}
        />
      </StyledMultiSelectWrapper>
    );
  }, [
    schemaItem,
    isValueValid,
    isDirty,
    onBlurHandler,
    onOptionChange,
    onFilterChange,
    onFocusHandler,
    value,
  ]);

  return (
    <Field
      defaultValue={fieldDefaultValue}
      defaultValueValidatorFn={defaultValueValidator}
      fieldClassName={fieldClassName}
      isRequiredField={isRequired}
      label={schemaItem.label}
      labelStyle={schemaItem.labelStyle}
      labelTextColor={schemaItem.labelTextColor}
      labelTextSize={schemaItem.labelTextSize}
      name={name}
      tooltip={schemaItem.tooltip}
    >
      {fieldComponent}
    </Field>
  );
}

MultiSelectField.componentDefaultValues = {
  ...COMPONENT_DEFAULT_VALUES,
  isDisabled: false,
};

export default MultiSelectField;
