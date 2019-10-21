import React from "react";
import Select from "react-select";
import { WrappedFieldInputProps } from "redux-form";

type DropdownProps = {
  options: Array<{
    value: string;
    label: string;
  }>;
  input: WrappedFieldInputProps;
};

const selectStyles = {
  control: (styles: any) => ({
    ...styles,
    width: 100,
  }),
};

export const BaseDropdown = (props: DropdownProps) => {
  const { input, options } = props;
  return (
    <Select
      defaultValue={options[0]}
      options={options}
      styles={selectStyles}
      {...input}
      onChange={value => input.onChange(value)}
      onBlur={() => input.onBlur(input.value)}
    />
  );
};

const Dropdown = (props: DropdownProps) => {
  return <BaseDropdown {...props} />;
};

export default Dropdown;
