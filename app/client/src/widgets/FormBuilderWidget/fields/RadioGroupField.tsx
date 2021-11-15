import React from "react";
import { pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import RadioGroupComponent from "widgets/RadioGroupWidget/component";
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
  label: "",
  isVisible: true,
  options: [
    { label: "Yes", value: "Y" },
    { label: "No", value: "N" },
  ],
};

function RadioGroupField({ name, schemaItem, ...rest }: RadioGroupFieldProps) {
  const labelStyles = pick(schemaItem, [
    "labelStyle",
    "labelTextColor",
    "labelTextSize",
  ]);

  return (
    <Field
      {...rest}
      defaultValue={schemaItem.defaultValue}
      label={schemaItem.label}
      labelStyles={labelStyles}
      name={name}
      render={({ field: { onChange, value } }) => (
        <RadioGroupComponent
          isLoading={false}
          label=""
          onRadioSelectionChange={onChange}
          options={schemaItem.options || []}
          selectedOptionValue={value}
          widgetId=""
        />
      )}
    />
  );
}

RadioGroupField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default RadioGroupField;
