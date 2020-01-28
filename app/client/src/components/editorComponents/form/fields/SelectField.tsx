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
      <FormFieldError
        error={componentProps.meta.touched && componentProps.meta.error}
      />
    </React.Fragment>
  );
};

type SelectFieldProps = {
  name: string;
  placeholder?: string;
  options?: Array<{ id: string; name: string; value?: string }>;
  size?: "large" | "small";
};

export const SelectField = (props: SelectFieldProps) => {
  return (
    <Field
      name={props.name}
      placeholder={props.placeholder}
      component={renderComponent}
      options={props.options}
      size={props.size}
    />
  );
};

export default SelectField;
