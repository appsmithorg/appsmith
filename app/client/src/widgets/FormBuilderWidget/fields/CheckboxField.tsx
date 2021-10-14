import React from "react";
import { ControllerRenderProps } from "react-hook-form";

import Field from "widgets/FormBuilderWidget/component/Field";
import CheckboxComponent from "widgets/CheckboxWidget/component";
import { SchemaItem } from "../constants";

type CheckboxFieldProps = {
  name: ControllerRenderProps["name"];
  schemaItem: SchemaItem;
};

function CheckboxField({ name, schemaItem }: CheckboxFieldProps) {
  const { label } = schemaItem;

  return (
    <Field
      name={name}
      render={({ field: { onBlur, onChange, ref, value } }) => (
        <CheckboxComponent
          alignWidget="LEFT"
          inputRef={ref}
          isChecked={value}
          isLoading={false}
          isRequired={false}
          label={label}
          onBlurHandler={onBlur}
          onCheckChange={onChange}
          // TODO: Handle default value of rowSpace
          rowSpace={20}
          widgetId=""
        />
      )}
    />
  );
}

export default CheckboxField;
