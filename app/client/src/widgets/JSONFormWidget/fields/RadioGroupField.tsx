import React from "react";

import Field from "widgets/JSONFormWidget/component/Field";
import RadioGroupComponent from "widgets/RadioGroupWidget/component";
import useRegisterFieldValidity from "./useRegisterFieldInvalid";
import { RadioOption } from "widgets/RadioGroupWidget/constants";
import { BaseFieldComponentProps, FieldComponentBaseProps } from "../constants";

type RadioGroupComponentProps = FieldComponentBaseProps & {
  options: RadioOption[];
  onSelectionChange?: string;
};

export type RadioGroupFieldProps = BaseFieldComponentProps<
  RadioGroupComponentProps
>;

const COMPONENT_DEFAULT_VALUES: RadioGroupComponentProps = {
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  label: "",
  options: [
    { label: "Yes", value: "Y" },
    { label: "No", value: "N" },
  ],
};

const isValid = (
  schemaItem: RadioGroupFieldProps["schemaItem"],
  value?: string,
) => (schemaItem.isRequired ? Boolean(value) : true);

function RadioGroupField({
  fieldClassName,
  name,
  schemaItem,
}: RadioGroupFieldProps) {
  const { onFieldValidityChange } = useRegisterFieldValidity({
    fieldName: name,
    fieldType: schemaItem.fieldType,
  });

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
      render={({ field: { onChange, value } }) => {
        const isValueValid = isValid(schemaItem, value);

        onFieldValidityChange(isValueValid);

        return (
          <RadioGroupComponent
            isDisabled={schemaItem.isDisabled}
            isLoading={false}
            label=""
            onRadioSelectionChange={onChange}
            options={schemaItem.options || []}
            selectedOptionValue={value}
            widgetId=""
          />
        );
      }}
      tooltip={schemaItem.tooltip}
    />
  );
}

RadioGroupField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default RadioGroupField;
