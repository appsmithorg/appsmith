import React from "react";
import Creatable from "react-select/creatable";
import { WrappedFieldInputProps } from "redux-form";

type DropdownProps = {
  options: Array<{
    value: string;
    label: string;
  }>;
  placeholder: string;
  isLoading?: boolean;
  input: WrappedFieldInputProps;
  onCreateOption: (inputValue: string) => void;
};

const selectStyles = {
  container: (styles: any) => ({
    ...styles,
    flex: 1,
  }),
};

class CreatableDropdown extends React.Component<DropdownProps> {
  render() {
    const {
      placeholder,
      options,
      isLoading,
      onCreateOption,
      input,
    } = this.props;
    return (
      <Creatable
        placeholder={placeholder}
        options={options}
        styles={selectStyles}
        isLoading={isLoading}
        onCreateOption={onCreateOption}
        {...input}
        onChange={value => input.onChange(value)}
      />
    );
  }
}

export default CreatableDropdown;
