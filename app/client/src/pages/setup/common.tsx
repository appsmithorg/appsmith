import React from "react";
import { FormGroup as StyledFormGroup } from "design-system-old";
import type { FormTextFieldProps } from "components/utils/ReduxFormTextField";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import styled from "styled-components";
import type { OptionType } from "./constants";
import { Select, Option } from "design-system";

export const FormHeaderLabel = styled.h5`
  width: 100%;
  font-size: 20px;
  font-weight: 500;
  color: var(--ads-v2-color-fg-emphasis);
`;

export const FormHeaderIndex = styled.h5`
  font-size: 20px;
  font-weight: 500;
`;

export const FormBodyWrapper = styled.div`
  padding: ${(prop) => prop.theme.spaces[10]}px 0px;
`;

export const FormHeaderSubtext = styled.p`
  color: var(--ads-v2-color-fg);
`;

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
  display: block;
`;

export const AllowToggle = styled.div``;

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

  && > .bp3-label {
    color: var(--ads-v2-color-fg);
  }

  .dropdown-errorMsg {
    font-size: 12px;
    color: var(--ads-v2-color-fg-error);
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

export function withDropdown(options: OptionType[]) {
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
      <>
        <Select
          className={DROPDOWN_CLASSNAME}
          defaultValue={selected}
          isValid={!hasError}
          onSelect={onSelect}
        >
          {options.map((role, index) => (
            <Option key={index} value={role.value}>
              {role.label}
            </Option>
          ))}
        </Select>
        {hasError && (
          <div className="dropdown-errorMsg">{componentProps.meta.error}</div>
        )}
      </>
    );
  };
}
