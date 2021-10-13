import React from "react";
import styled from "styled-components";
import {
  Field,
  InjectedFormProps,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import {
  FormBodyWrapper,
  FormHeaderIndex,
  FormHeaderLabel,
  FormHeaderWrapper,
} from "./common";
import Dropdown from "components/ads/Dropdown";
import StyledFormGroup from "components/ads/formFields/FormGroup";
import {
  createMessage,
  WELCOME_FORM_EMAIL_ID,
  WELCOME_FORM_FULL_NAME,
  WELCOME_FORM_CREATE_PASSWORD,
  WELCOME_FORM_VERIFY_PASSWORD,
  WELCOME_FORM_ROLE_DROPDOWN,
  WELCOME_FORM_ROLE,
  WELCOME_FORM_USE_CASE,
  WELCOME_FORM_HEADER,
} from "constants/messages";
import FormTextField, {
  FormTextFieldProps,
} from "components/ads/formFields/TextField";
import { DetailsFormValues } from "./SetupForm";
import { ButtonWrapper } from "pages/Applications/ForkModalStyles";
import Button, { Category, Size } from "components/ads/Button";
import { OptionType, roleOptions, useCaseOptions } from "./constants";

const DetailsFormWrapper = styled.div`
  width: 100%;
  position: relative;
  padding-left: ${(props) => props.theme.spaces[17] * 2}px;
  padding-right: ${(props) => props.theme.spaces[4]}px;
`;

const StyledFormBodyWrapper = styled(FormBodyWrapper)`
  width: 260px;
`;

const DROPDOWN_CLASSNAME = "setup-dropdown";
const DropdownWrapper = styled(StyledFormGroup)`
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
`;

function withDropdown(options: OptionType[]) {
  return function Fieldropdown(
    ComponentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    function onSelect(value?: string) {
      ComponentProps.input.onChange && ComponentProps.input.onChange(value);
      ComponentProps.input.onBlur && ComponentProps.input.onBlur(value);
    }

    const selected =
      options.find((option) => option.value == ComponentProps.input.value) ||
      {};

    return (
      <Dropdown
        className={DROPDOWN_CLASSNAME}
        dontUsePortal
        onSelect={onSelect}
        options={options}
        selected={selected}
        showLabelOnly
        width="260px"
      />
    );
  };
}

export default function DetailsForm(
  props: InjectedFormProps & DetailsFormValues & { onNext?: () => void },
) {
  const ref = React.createRef<HTMLDivElement>();

  return (
    <DetailsFormWrapper ref={ref}>
      <FormHeaderWrapper>
        <FormHeaderIndex>1.</FormHeaderIndex>
        <FormHeaderLabel>{createMessage(WELCOME_FORM_HEADER)}</FormHeaderLabel>
      </FormHeaderWrapper>
      <StyledFormBodyWrapper>
        <StyledFormGroup label={createMessage(WELCOME_FORM_FULL_NAME)}>
          <FormTextField
            autoFocus
            name="name"
            placeholder="John Doe"
            type="text"
          />
        </StyledFormGroup>
        <StyledFormGroup label={createMessage(WELCOME_FORM_EMAIL_ID)}>
          <FormTextField
            name="email"
            placeholder="How can we reach you?"
            type="email"
          />
        </StyledFormGroup>
        <StyledFormGroup label={createMessage(WELCOME_FORM_CREATE_PASSWORD)}>
          <FormTextField
            name="password"
            placeholder="Make it strong!"
            type="password"
          />
        </StyledFormGroup>
        <StyledFormGroup label={createMessage(WELCOME_FORM_VERIFY_PASSWORD)}>
          <FormTextField
            name="verifyPassword"
            placeholder="Type correctly"
            type="password"
          />
        </StyledFormGroup>
        <DropdownWrapper label={createMessage(WELCOME_FORM_ROLE_DROPDOWN)}>
          <Field
            asyncControl
            component={withDropdown(roleOptions)}
            name="role"
            placeholder=""
            type="text"
          />
        </DropdownWrapper>
        {props.role == "other" && (
          <StyledFormGroup label={createMessage(WELCOME_FORM_ROLE)}>
            <FormTextField name="role_name" placeholder="" type="text" />
          </StyledFormGroup>
        )}
        <DropdownWrapper label={createMessage(WELCOME_FORM_USE_CASE)}>
          <Field
            asyncControl
            component={withDropdown(useCaseOptions)}
            name="useCase"
            placeholder=""
            type="text"
          />
        </DropdownWrapper>
        <ButtonWrapper>
          <Button
            category={Category.tertiary}
            disabled={props.invalid}
            onClick={props.onNext}
            size={Size.medium}
            tag="button"
            text="Next"
            type="button"
          />
        </ButtonWrapper>
      </StyledFormBodyWrapper>
    </DetailsFormWrapper>
  );
}
