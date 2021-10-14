import React from "react";

import Field from "widgets/FormBuilderWidget/component/Field";
import RadioGroupComponent from "widgets/RadioGroupWidget/component";
import { BaseFieldComponentProps } from "./types";
import { RadioOption } from "widgets/RadioGroupWidget/constants";

type RadioGroupComponentOwnProps = {
  options: RadioOption[];
};

type RadioGroupFieldProps = BaseFieldComponentProps<
  RadioGroupComponentOwnProps
>;

function RadioGroupField({ name, schemaItem }: RadioGroupFieldProps) {
  const { label, props } = schemaItem;
  const { options = [] } = props;

  return (
    <Field
      name={name}
      render={({ field: { onChange, value } }) => (
        <RadioGroupComponent
          isDisabled={false}
          isLoading={false}
          label={label}
          onRadioSelectionChange={onChange}
          options={options}
          selectedOptionValue={value}
          widgetId=""
        />
      )}
    />
  );
}

RadioGroupField.componentDefaultValues = {};

export default RadioGroupField;
