import React from "react";
import Dropdown from "components/ads/Dropdown";
import StyledFormGroup from "components/ads/formFields/FormGroup";
import { FormTextFieldProps } from "components/ads/formFields/TextField";
import { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import styled from "styled-components";
import { OptionType } from "./constants";

export const FormHeaderWrapper = styled.div`
  position: relative;
`;

export const FormHeaderLabel = styled.h5`
  width: 100%;
  font-size: 20px;
  font-weight: 500;
`;

export const FormHeaderIndex = styled.h5`
  font-size: 20px;
  font-weight: 500;
`;

export const FormBodyWrapper = styled.div`
  padding: ${(prop) => prop.theme.spaces[10]}px 0px;
`;

export const FormHeaderSubtext = styled.p``;

export const ControlWrapper = styled.div`
  margin: ${(prop) => prop.theme.spaces[6]}px 0px;
`;

export const Label = styled.label`
  display: inline-block;
  margin-bottom: 10px;
`;

export const ButtonWrapper = styled.div`
  margin: ${(prop) => prop.theme.spaces[17] * 2}px 0px 0px;
`;

export const AllowToggleWrapper = styled.div`
  display: flex;
`;

export const AllowToggle = styled.div`
  flex-basis: 68px;
`;

export const AllowToggleLabel = styled.p`
  margin-bottom: 0px;
  margin-top: 2px;
`;

export const StyledLink = styled.a`
  &,
  &:hover {
    color: ${(props) => props.theme.colors.link};
    text-decoration: none;
  }
`;

const DROPDOWN_CLASSNAME = "setup-dropdown";
export const DropdownWrapper = styled(StyledFormGroup)`
  && {
    margin-bottom: 33px;
  }
  && .cs-text {
    width: 100%;
  }

  .${DROPDOWN_CLASSNAME} {
    .ads-dropdown-options-wrapper {
      padding: 0;
      border: 1px solid rgba(0, 0, 0, 8%);
    }
  }

  .ads-dropdown-errorMsg {
    font-size: ${(props) => props.theme.fontSizes[3]}px;
  }
`;

export const Center = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
`;

export function withDropdown(options: OptionType[], width: string) {
  return function DropdownField(
    componentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    function onSelect(value?: string) {
      componentProps.input.onChange && componentProps.input.onChange(value);
      componentProps.input.onBlur && componentProps.input.onBlur(value);
    }

    const selected = options.find(
      (option) => option.value == componentProps.input.value,
    ) || { label: componentProps.placeholder };
    const hasError = componentProps.meta.invalid && componentProps.meta.touched;

    return (
      <Dropdown
        className={DROPDOWN_CLASSNAME}
        dontUsePortal
        errorMsg={hasError ? componentProps.meta.error : ""}
        fillOptions
        onSelect={onSelect}
        options={options}
        selected={selected}
        showLabelOnly
        width={width}
      />
    );
  };
}
