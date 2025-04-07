import React from "react";
import { FormGroup as StyledFormGroup } from "@appsmith/ads-old";
import type { FormTextFieldProps } from "components/utils/ReduxFormTextField";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import styled from "styled-components";
import type { OptionType } from "./constants";
import { Select, Option } from "@appsmith/ads";

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
  && .cs-text {
    width: 100%;
  }

  && > .bp3-label {
    color: var(--ads-v2-color-fg);
    font-weight: normal;
    margin-bottom: 0.5rem;
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

export const UserWelcomeScreenWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin: 0 auto;
  overflow: auto;
  min-width: 800px;
  background: var(--ads-v2-color-gray-50);
`;

export const UserWelcomeScreenContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: start;
  justify-content: center;
  position: relative;
  z-index: 100;
`;

export const UserWelcomeScreenTextBanner = styled.div<{
  isSuperUser?: boolean;
}>`
  width: 60%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  ${(props) =>
    props.isSuperUser
      ? "padding: calc(2*var(--ads-spaces-17)) 0 0;"
      : "justify-content: center; padding-block: var(--ads-spaces-12);"}
  margin-left: 8rem;
`;

export const UserWelcomeScreenBannerHeader = styled.div`
  font-size: calc(2 * var(--ads-v2-font-size-10));
  margin: 0px;
  font-weight: var(--ads-font-weight-bold-xl);
  color: var(--ads-v2-color-fg-emphasis-plus);
`;

export const UserWelcomeScreenBannerBody = styled.div`
  font-size: 24px;
  margin: 0px;
  font-weight: 500;
  color: var(--ads-v2-color-fg-emphasis);
`;

export const UserWelcomeScreenActionContainer = styled.div`
  margin-top: ${(props) => props.theme.spaces[15]}px;
`;
