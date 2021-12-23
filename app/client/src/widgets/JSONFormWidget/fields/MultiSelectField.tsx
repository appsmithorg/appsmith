import React, { useContext } from "react";
import styled from "styled-components";
import { pick } from "lodash";

import Field from "widgets/JSONFormWidget/component/Field";
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
  label: "",
  isVisible: true,
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

function MultiSelectField({
  name,
  propertyPath,
  schemaItem,
  ...rest
}: MultiSelectFieldProps) {
  const {
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;
  const { executeAction, updateWidgetMetaProperty } = useContext(FormContext);
  const {
    onBlurHandler,
    onFocusHandler,
    registerFieldOnBlurHandler,
  } = useEvents<HTMLInputElement>({
    onFocusDynamicString,
    onBlurDynamicString,
  });

  const { onFieldValidityChange } = useRegisterFieldValidity({
    fieldName: name,
    fieldType: schemaItem.fieldType,
  });

  const labelStyles = pick(schemaItem, [
    "labelStyle",
    "labelTextColor",
    "labelTextSize",
  ]);

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

  return (
    <Field
      {...rest}
      defaultValue={schemaItem.defaultValue}
      label={schemaItem.label}
      labelStyles={labelStyles}
      name={name}
      render={({
        field: { onChange, value = [], onBlur },
        fieldState: { isDirty },
      }) => {
        const onOptionChange = (values: DefaultValueType) => {
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
        };

        const isValueValid = isValid(schemaItem, value);

        registerFieldOnBlurHandler(onBlur);
        onFieldValidityChange(isValueValid);

        return (
          <StyledMultiSelectWrapper>
            <MultiSelect
              compactMode={false}
              disabled={schemaItem.isDisabled}
              dropDownWidth={90}
              dropdownStyle={{
                zIndex: Layers.dropdownModalWidget,
              }}
              isValid={isDirty ? isValueValid : true}
              loading={false}
              onBlur={onBlurHandler}
              onChange={onOptionChange}
              onFilterChange={onFilterChange}
              onFocus={onFocusHandler}
              options={schemaItem.options}
              placeholder={schemaItem.placeholderText || ""}
              serverSideFiltering={schemaItem.serverSideFiltering}
              value={value}
              width={100}
            />
          </StyledMultiSelectWrapper>
        );
      }}
    />
  );
}

MultiSelectField.componentDefaultValues = {
  ...COMPONENT_DEFAULT_VALUES,
  isDisabled: false,
};

export default MultiSelectField;
