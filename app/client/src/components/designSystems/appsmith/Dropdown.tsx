import React from "react";
import Select from "react-select";
import { WrappedFieldInputProps } from "redux-form";

type DropdownProps = {
  options: Array<{
    value: string;
    label: string;
  }>;
  input: WrappedFieldInputProps;
  placeholder: string;
};

const selectStyles = {
  control: (styles: any) => ({
    ...styles,
    width: 120,
  }),
};

export const BaseDropdown = (props: DropdownProps) => {
  const { input, options } = props;
  return (
    <Select
      placeholder={props.placeholder}
      options={options}
      styles={selectStyles}
      {...input}
      onChange={value => input.onChange(value)}
    />
  );
};

const Dropdown = (props: DropdownProps) => {
  return <BaseDropdown {...props} />;
};

export default Dropdown;
