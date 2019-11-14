import React from "react";
import Creatable from "react-select/creatable";
import { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { theme } from "../../../constants/DefaultTheme";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const Error = styled.span`
  color: ${props => props.theme.colors.error};
  fontsize: ${props => props.theme.fontSizes[1]};
`;

type DropdownProps = {
  options: Array<{
    value: string;
    label: string;
  }>;
  placeholder: string;
  isLoading?: boolean;
  input: WrappedFieldInputProps;
  meta: WrappedFieldMetaProps;
  onCreateOption: (inputValue: string) => void;
  formatCreateLabel?: (value: string) => React.ReactNode;
};

const selectStyles = {
  singleValue: (provided: any) => ({
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
  container: (styles: any) => ({
    ...styles,
    flex: 1,
  }),
  control: (styles: any, state: any) => ({
    ...styles,
    width: 370,
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
};

class CreatableDropdown extends React.Component<DropdownProps> {
  render() {
    const {
      placeholder,
      options,
      isLoading,
      onCreateOption,
      input,
      meta,
      formatCreateLabel,
    } = this.props;
    const optionalProps: Partial<DropdownProps> = {};
    if (formatCreateLabel) optionalProps.formatCreateLabel = formatCreateLabel;
    return (
      <Wrapper>
        <Creatable
          placeholder={placeholder}
          options={options}
          styles={selectStyles}
          isLoading={isLoading}
          onCreateOption={onCreateOption}
          {...input}
          onChange={value => input.onChange(value)}
          onBlur={() => input.value}
          isClearable
          {...optionalProps}
        />
        {meta && meta.touched && meta.error && <Error>{meta.error}</Error>}
      </Wrapper>
    );
  }
}

export default CreatableDropdown;
