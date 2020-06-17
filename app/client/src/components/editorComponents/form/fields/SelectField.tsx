import React from "react";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import FormFieldError from "components/editorComponents/form/FieldError";
import SelectComponent from "components/editorComponents/SelectComponent";

const renderComponent = (
  componentProps: SelectFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  return (
    <React.Fragment>
      <SelectComponent {...componentProps} />
    </React.Fragment>
  );
};

type SelectFieldProps = {
  name: string;
  placeholder?: string;
  options?: Array<{ id: string; name: string; value?: string }>;
  size?: "large" | "small";
  outline?: boolean;
};

export const SelectField = (props: SelectFieldProps) => {
  return (
    <Field
      name={props.name}
      placeholder={props.placeholder}
      component={renderComponent}
      options={props.options}
      size={props.size}
      outline={props.outline}
    />
  );
};

export default SelectField;
