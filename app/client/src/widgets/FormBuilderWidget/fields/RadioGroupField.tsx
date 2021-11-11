import React from "react";

import Field from "widgets/FormBuilderWidget/component/Field";
import RadioGroupComponent from "widgets/RadioGroupWidget/component";
import { BaseFieldComponentProps } from "./types";
import { RadioOption } from "widgets/RadioGroupWidget/constants";

type RadioGroupComponentOwnProps = {
  options: RadioOption[];
  isDisabled: false;
};

type RadioGroupFieldProps = BaseFieldComponentProps<
  RadioGroupComponentOwnProps
>;

function RadioGroupField({ name, schemaItem, ...rest }: RadioGroupFieldProps) {
  return (
    <Field
      {...rest}
      label={schemaItem.label}
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

RadioGroupField.componentDefaultValues = {
  isDisabled: false,
};

export default RadioGroupField;
