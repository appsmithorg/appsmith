import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import Field from "widgets/FormBuilderWidget/component/Field";
import RadioGroupComponent from "widgets/RadioGroupWidget/component";
import { RadioOption } from "widgets/RadioGroupWidget/constants";
import { SchemaItem } from "../constants";

type RadioGroupComponentOwnProps = {
  options: RadioOption[];
};

type RadioGroupFieldProps = {
  name: ControllerRenderProps["name"];
  schemaItem: SchemaItem<RadioGroupComponentOwnProps>;
};

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

export default RadioGroupField;
