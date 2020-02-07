import React from "react";
import Select from "react-select";

import { WrappedFieldInputProps } from "redux-form";
import { theme } from "constants/DefaultTheme";

type DropdownProps = {
  options: Array<{
    value: string;
    label: string;
  }>;
  input: WrappedFieldInputProps;
  placeholder: string;
  width?: number;
};

const selectStyles = {
  placeholder: (provided: any) => ({
    ...provided,
    color: "#a3b3bf",
  }),
  control: (styles: any, state: any) => ({
    ...styles,
    width: state.selectProps.width || 100,
    minHeight: "32px",
    border: state.isFocused
      ? `${theme.colors.secondary} solid 1px`
      : `${theme.colors.inputInactiveBorders} solid 1px`,
    boxShadow: state.isFocused ? 0 : 0,
    "&:hover": {
      border: `${theme.colors.secondary} solid 1px`,
    },
  }),
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: "30px",
  }),
  clearIndicator: (provided: any) => ({
    ...provided,
    padding: "5px",
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    padding: "5px",
  }),
  indicatorSeparator: (styles: any) => ({}),
};

export const BaseDropdown = (props: DropdownProps) => {
  const { input, options } = props;
  return (
    <Select
      placeholder={props.placeholder}
      options={options}
      styles={selectStyles}
      {...input}
      width={props.width}
      onChange={value => input.onChange(value)}
    />
  );
};

const Dropdown = (props: DropdownProps) => {
  return <BaseDropdown {...props} />;
};

export default Dropdown;
