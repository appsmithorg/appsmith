import React from "react";
import type { InputActionMeta } from "react-select";
import Select from "react-select";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";

import { theme } from "constants/DefaultTheme";
import type { SelectComponents } from "react-select/src/components";

interface DropdownProps {
  options: Array<{
    value: string;
    label: string;
  }>;
  placeholder: string;
  isLoading?: boolean;
  input: WrappedFieldInputProps;
  meta: WrappedFieldMetaProps;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: SelectComponents<any>;
  onCreateOption: (inputValue: string) => void;
  formatCreateLabel?: (value: string) => React.ReactNode;
  noOptionsMessage?: (obj: { inputValue: string }) => string;
  inputValue?: string;
  onInputChange: (value: string, actionMeta: InputActionMeta) => void;
}

const selectStyles = {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  placeholder: (provided: any) => ({
    ...provided,
    color: "#a3b3bf",
  }),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: "rgba(104,113,239,0.1)",
    border: "1px solid rgba(104, 113, 239, 0.5)",
    borderRadius: `${theme.radii[1]}px`,
    padding: "2px 5px",
    fontSize: "14px",
    maxWidth: "95%",
    position: "relative",
    display: "inline-block",
    transform: "none",
  }),
  multiValueRemove: () => {
    return {
      display: "none",
    };
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  container: (styles: any) => ({
    ...styles,
    flex: 1,
    zIndex: "5",
  }),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: (styles: any, state: any) => ({
    ...styles,
    minHeight: "32px",
    border: state.isFocused
      ? `${theme.colors.secondary} solid 1px`
      : `${theme.colors.inputInactiveBorders} solid 1px`,
    boxShadow: state.isFocused ? "none" : "none",
    "&:hover": {
      border: `${theme.colors.secondary} solid 1px`,
    },
  }),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indicatorsContainer: (provided: any) => ({
    ...provided,
    height: "30px",
  }),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearIndicator: (provided: any) => ({
    ...provided,
    padding: "5px",
  }),
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dropdownIndicator: (provided: any) => ({
    ...provided,
    padding: "5px",
  }),
};

class CreatableDropdown extends React.Component<DropdownProps> {
  render() {
    const {
      components,
      input,
      inputValue,
      isLoading,
      noOptionsMessage,
      onInputChange,
      options,
      placeholder,
    } = this.props;
    const optionalProps: Partial<DropdownProps> = {};
    if (noOptionsMessage) optionalProps.noOptionsMessage = noOptionsMessage;
    if (components) optionalProps.components = components;
    if (inputValue) optionalProps.inputValue = inputValue;
    if (onInputChange) optionalProps.onInputChange = onInputChange;

    return (
      <Select
        isLoading={isLoading}
        isMulti
        options={options}
        placeholder={placeholder}
        styles={selectStyles}
        {...input}
        isClearable
        onBlur={() => input.value}
        onChange={(value) => {
          const formattedValue = value;
          if (formattedValue && formattedValue.length > 1) {
            formattedValue.shift();
          }

          input.onChange(formattedValue);
        }}
        {...optionalProps}
      />
    );
  }
}

export default CreatableDropdown;
