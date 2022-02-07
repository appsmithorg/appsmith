import React, { useCallback, useContext, useMemo } from "react";
import styled from "styled-components";
import { useController } from "react-hook-form";

import FormContext from "../FormContext";
import MultiSelect from "widgets/MultiSelectWidget/component";
import useEvents from "./useEvents";
import useRegisterFieldValidity from "./useRegisterFieldInvalid";
import { Layers } from "constants/Layers";
import {
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  FieldEventProps,
} from "../constants";
import { DropdownOption } from "widgets/MultiSelectTreeWidget/widget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { DefaultValueType } from "rc-select/lib/interface/generator";
import Field from "../component/Field";

type MultiSelectComponentProps = FieldComponentBaseProps &
  FieldEventProps & {
    defaultValue?: string[];
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

const DEFAULT_VALUE = [""];

function MultiSelectField({
  fieldClassName,
  name,
  passedDefaultValue,
  propertyPath,
  schemaItem,
}: MultiSelectFieldProps) {
  const {
    fieldType,
    isRequired,
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;
  const { executeAction, updateWidgetMetaProperty } = useContext(FormContext);
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

  const onFilterChange = useCallback(
    (value: string) => {
      updateWidgetMetaProperty(`${propertyPath}.filterText`, value);

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
      onChange(values);

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
          compactMode={false}
          disabled={schemaItem.isDisabled}
          dropDownWidth={90}
          dropdownStyle={DEFAULT_DROPDOWN_STYLES}
          isValid={isDirty ? isValueValid : true}
          loading={false}
          onBlur={onBlurHandler}
          onChange={onOptionChange}
          onFilterChange={onFilterChange}
          onFocus={onFocusHandler}
          options={schemaItem.options || []}
          placeholder={schemaItem.placeholderText || ""}
          serverSideFiltering={schemaItem.serverSideFiltering}
          value={value || DEFAULT_VALUE}
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
      defaultValue={schemaItem.defaultValue || passedDefaultValue}
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
