import React from "react";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import DropdownWrapper from "./DropdownWrapper";

const renderComponent = (
  componentProps: SelectFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  return (
    <React.Fragment>
      <DropdownWrapper {...componentProps} />
    </React.Fragment>
  );
};

type SelectFieldProps = {
  name: string;
  placeholder: string;
  options: Array<{ id: string; value: string; label: string }>;
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
