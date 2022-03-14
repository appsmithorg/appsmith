import React, {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import { useController } from "react-hook-form";

import Field from "widgets/JSONFormWidget/component/Field";
import FormContext from "../FormContext";
import SelectComponent from "widgets/SelectWidget/component";
import useRegisterFieldValidity from "./useRegisterFieldValidity";
import useUpdateInternalMetaState from "./useUpdateInternalMetaState";
import { BaseFieldComponentProps, FieldComponentBaseProps } from "../constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { DropdownOption } from "widgets/SelectWidget/constants";
import { isPrimitive } from "../helper";
import { isNil } from "lodash";

type MetaProps = {
  filterText?: string;
};

type DefaultValue = string | number | DropdownOption | null | undefined;

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

const isValid = (schemaItem: SelectFieldProps["schemaItem"], value?: unknown) =>
  !schemaItem.isRequired || !isNil(value);

const composeDefaultValue = (
  schemaItemDefaultValue: DefaultValue,
  passedDefaultValue: DefaultValue,
) => {
  if (isPrimitive(passedDefaultValue)) return passedDefaultValue;
  if (isPrimitive(schemaItemDefaultValue)) return schemaItemDefaultValue;

  return schemaItemDefaultValue?.value ?? passedDefaultValue?.value;
};

function SelectField({
  fieldClassName,
  name,
  passedDefaultValue,
  schemaItem,
}: SelectFieldProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDirtyRef = useRef<boolean>(false);
  const { executeAction } = useContext(FormContext);
  const [filterText, setFilterText] = useState<string>();
  const {
    field: { onChange, value },
  } = useController({
    name,
  });

  const isValueValid = isValid(schemaItem, value);
  const options = Array.isArray(schemaItem.options) ? schemaItem.options : [];

  const defaultValue = composeDefaultValue(
    schemaItem.defaultValue,
    passedDefaultValue as DefaultValue,
  );

  useRegisterFieldValidity({
    isValid: isValueValid,
    fieldName: name,
    fieldType: schemaItem.fieldType,
  });

  useUpdateInternalMetaState({
    propertyName: `${name}.filterText`,
    propertyValue: filterText,
  });

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
    [executeAction, schemaItem.onFilterUpdate],
  );

  const selectedOptionIndex = options.findIndex(
    (option) => option.value === value,
  );
  const selectedIndex =
    selectedOptionIndex > -1 ? selectedOptionIndex : undefined;

  const onOptionSelected = useCallback(
    (option: DropdownOption) => {
      onChange(option.value);

      if (!isDirtyRef.current) {
        isDirtyRef.current = true;
      }

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

  const dropdownWidth = wrapperRef.current?.clientWidth;
  const fieldComponent = useMemo(
    () => (
      <StyledSelectWrapper ref={wrapperRef}>
        <SelectComponent
          compactMode={false}
          disabled={schemaItem.isDisabled}
          dropDownWidth={dropdownWidth || 100}
          filterText={filterText}
          hasError={isDirtyRef.current ? !isValueValid : false}
          height={10}
          isFilterable={schemaItem.isFilterable}
          isLoading={false}
          isValid={isValueValid}
          onFilterChange={onFilterChange}
          onOptionSelected={onOptionSelected}
          options={options}
          placeholder={schemaItem.placeholderText}
          selectedIndex={selectedIndex}
          serverSideFiltering={schemaItem.serverSideFiltering}
          value={options[selectedOptionIndex]?.value}
          widgetId={name}
          width={10}
        />
      </StyledSelectWrapper>
    ),
    [
      name,
      selectedOptionIndex,
      schemaItem.serverSideFiltering,
      schemaItem.placeholderText,
      options,
      onFilterChange,
      schemaItem.isFilterable,
      schemaItem.isDisabled,
      isDirtyRef,
      filterText,
      wrapperRef,
      isValueValid,
      onOptionSelected,
      selectedIndex,
      dropdownWidth,
    ],
  );

  return (
    <Field
      accessor={schemaItem.accessor}
      defaultValue={defaultValue}
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
