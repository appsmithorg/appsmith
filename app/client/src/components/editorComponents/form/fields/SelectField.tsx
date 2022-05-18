import React from "react";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
  // @ts-expect-error: redux-form import
} from "redux-form/dist/redux-form";
import DropdownWrapper from "./DropdownWrapper";

const renderComponent = (
  componentProps: SelectFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  return <DropdownWrapper {...componentProps} />;
};

type SelectFieldProps = {
  name: string;
  placeholder: string;
  options: Array<{ id: string; value: string; label?: string }>;
  size?: "large" | "small";
  outline?: boolean;
  fillOptions?: boolean;
};

export function SelectField(props: SelectFieldProps) {
  return (
    <Field
      component={renderComponent}
      fillOptions={props.fillOptions}
      name={props.name}
      options={props.options}
      outline={props.outline}
      placeholder={props.placeholder}
      size={props.size}
    />
  );
}

export default SelectField;
