import React from "react";
import styled from "styled-components";
import { Field } from "redux-form";
import {
  DropdownWrapper,
  FormBodyWrapper,
  FormHeaderIndex,
  FormHeaderLabel,
  withDropdown,
} from "./common";
import {
  createMessage,
  WELCOME_FORM_EMAIL_ID,
  WELCOME_FORM_FULL_NAME,
  WELCOME_FORM_CREATE_PASSWORD,
  WELCOME_FORM_VERIFY_PASSWORD,
  WELCOME_FORM_ROLE_DROPDOWN,
  WELCOME_FORM_ROLE,
  WELCOME_FORM_USE_CASE,
  WELCOME_FORM_CUSTOM_USE_CASE,
  WELCOME_FORM_HEADER,
  WELCOME_FORM_ROLE_DROPDOWN_PLACEHOLDER,
  WELCOME_FORM_USE_CASE_PLACEHOLDER,
} from "@appsmith/constants/messages";
import FormTextField from "components/utils/ReduxFormTextField";
import type { SetupFormProps } from "./SetupForm";
import { ButtonWrapper } from "pages/Applications/ForkModalStyles";
import { FormGroup } from "design-system-old";
import { Button } from "design-system";
import { roleOptions, useCaseOptions } from "./constants";

const DetailsFormWrapper = styled.div`
  width: 100%;
  position: relative;
  padding-left: ${(props) => props.theme.spaces[17] * 2}px;
  padding-right: ${(props) => props.theme.spaces[4]}px;
`;

const StyledFormBodyWrapper = styled(FormBodyWrapper)`
  width: 260px;
`;

const StyledFormGroup = styled(FormGroup)`
  && > .bp3-label {
    color: var(--ads-v2-color-fg);
  }
`;

export default function DetailsForm(
  props: SetupFormProps & { onNext?: () => void },
) {
  const ref = React.createRef<HTMLDivElement>();

  return (
    <DetailsFormWrapper ref={ref}>
      <div className="relative flex-col items-start">
        <FormHeaderIndex className="absolute -left-6">1.</FormHeaderIndex>
        <FormHeaderLabel>{createMessage(WELCOME_FORM_HEADER)}</FormHeaderLabel>
      </div>
      <StyledFormBodyWrapper>
        <StyledFormGroup
          className="t--welcome-form-full-name"
          label={createMessage(WELCOME_FORM_FULL_NAME)}
        >
          <FormTextField
            autoFocus
            name="name"
            placeholder="John Doe"
            type="text"
          />
        </StyledFormGroup>
        <StyledFormGroup
          className="t--welcome-form-email"
          label={createMessage(WELCOME_FORM_EMAIL_ID)}
        >
          <FormTextField
            name="email"
            placeholder="How can we reach you?"
            type="email"
          />
        </StyledFormGroup>
        <StyledFormGroup
          className="t--welcome-form-password"
          label={createMessage(WELCOME_FORM_CREATE_PASSWORD)}
        >
          <FormTextField
            name="password"
            placeholder="Make it strong!"
            type="password"
          />
        </StyledFormGroup>
        <StyledFormGroup
          className="t--welcome-form-verify-password"
          label={createMessage(WELCOME_FORM_VERIFY_PASSWORD)}
        >
          <FormTextField
            data-testid="verifyPassword"
            name="verifyPassword"
            placeholder="Type correctly"
            type="password"
          />
        </StyledFormGroup>
        <DropdownWrapper
          className="t--welcome-form-role-dropdown"
          label={createMessage(WELCOME_FORM_ROLE_DROPDOWN)}
        >
          <Field
            asyncControl
            component={withDropdown(roleOptions)}
            name="role"
            placeholder={createMessage(WELCOME_FORM_ROLE_DROPDOWN_PLACEHOLDER)}
            type="text"
          />
        </DropdownWrapper>
        {props.role == "other" && (
          <StyledFormGroup
            className="t--welcome-form-role-input"
            label={createMessage(WELCOME_FORM_ROLE)}
          >
            <FormTextField name="role_name" placeholder="" type="text" />
          </StyledFormGroup>
        )}
        <DropdownWrapper
          className="t--welcome-form-role-usecase"
          label={createMessage(WELCOME_FORM_USE_CASE)}
        >
          <Field
            asyncControl
            component={withDropdown(useCaseOptions)}
            name="useCase"
            placeholder={createMessage(WELCOME_FORM_USE_CASE_PLACEHOLDER)}
            type="text"
          />
        </DropdownWrapper>
        {props.useCase == "other" && (
          <StyledFormGroup
            className="t--welcome-form-use-case-input"
            label={createMessage(WELCOME_FORM_CUSTOM_USE_CASE)}
          >
            <FormTextField name="custom_useCase" placeholder="" type="text" />
          </StyledFormGroup>
        )}
        <ButtonWrapper>
          <Button
            className="t--welcome-form-next-button"
            isDisabled={props.invalid}
            kind="secondary"
            onClick={props.onNext}
            size="md"
          >
            Next
          </Button>
        </ButtonWrapper>
      </StyledFormBodyWrapper>
    </DetailsFormWrapper>
  );
}
