import React, { useCallback, useContext, useMemo, useRef } from "react";
import styled from "styled-components";
import { useController } from "react-hook-form";

import DropDownComponent from "widgets/DropdownWidget/component";
import Field from "widgets/JSONFormWidget/component/Field";
import FormContext from "../FormContext";
import useRegisterFieldValidity from "./useRegisterFieldInvalid";
import { DropdownOption } from "widgets/DropdownWidget/constants";
import { BaseFieldComponentProps, FieldComponentBaseProps } from "../constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

type MetaProps = {
  filterText?: string;
};

type SelectComponentProps = FieldComponentBaseProps &
  MetaProps & {
    placeholderText?: string;

    options: DropdownOption[];
    onOptionChange?: string;
    serverSideFiltering: boolean;
    onFilterUpdate?: string;
    isFilterable: boolean;
  };

const COMPONENT_DEFAULT_VALUES: SelectComponentProps = {
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

export type SelectFieldProps = BaseFieldComponentProps<SelectComponentProps>;

const StyledSelectWrapper = styled.div`
  width: 100%;
`;

const isValid = (schemaItem: SelectFieldProps["schemaItem"], value?: string) =>
  schemaItem.isRequired ? Boolean(value?.trim()) : true;

function SelectField({
  fieldClassName,
  name,
  propertyPath,
  schemaItem,
}: SelectFieldProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { executeAction, updateWidgetMetaProperty } = useContext(FormContext);
  const {
    field: { onChange, value },
    fieldState: { isDirty },
  } = useController({
    name,
    shouldUnregister: true,
  });

  const isValueValid = isValid(schemaItem, value);

  useRegisterFieldValidity({
    isValid: isValueValid,
    fieldName: name,
    fieldType: schemaItem.fieldType,
  });

  const onFilterChange = (value: string) => {
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
  };

  const selectedOptionIndex = schemaItem.options.findIndex(
    (option) => option.value === value,
  );
  const selectedIndex =
    selectedOptionIndex > -1 ? selectedOptionIndex : undefined;

  const onOptionSelected = useCallback(
    (option: DropdownOption) => {
      onChange(option.value);

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
    [onChange, schemaItem.onOptionChange, executeAction],
  );

  const fieldComponent = useMemo(
    () => (
      <StyledSelectWrapper ref={wrapperRef}>
        <DropDownComponent
          compactMode={false}
          disabled={schemaItem.isDisabled}
          dropDownWidth={wrapperRef.current?.clientWidth || 100}
          height={10}
          isFilterable={schemaItem.isFilterable}
          isLoading={false}
          isValid={isDirty ? isValueValid : true}
          onFilterChange={onFilterChange}
          onOptionSelected={onOptionSelected}
          options={schemaItem.options}
          placeholder={schemaItem.placeholderText}
          selectedIndex={selectedIndex}
          serverSideFiltering={schemaItem.serverSideFiltering}
          widgetId=""
          width={10}
        />
      </StyledSelectWrapper>
    ),
    [wrapperRef, isDirty, isValueValid, onOptionSelected, selectedIndex],
  );

  return (
    <Field
      defaultValue={schemaItem.defaultValue}
      fieldClassName={fieldClassName}
      isRequiredField={schemaItem.isRequired}
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

SelectField.componentDefaultValues = {
  ...COMPONENT_DEFAULT_VALUES,
  options: [
    { label: "Blue", value: "BLUE" },
    { label: "Green", value: "GREEN" },
    { label: "Red", value: "RED" },
  ],
};

export default SelectField;
