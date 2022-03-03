import React from "react";
import styled from "styled-components";
import { Field, InjectedFormProps } from "redux-form";
import {
  DropdownWrapper,
  FormBodyWrapper,
  FormHeaderIndex,
  FormHeaderLabel,
  FormHeaderWrapper,
  withDropdown,
} from "./common";
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
  WELCOME_FORM_CUSTOM_USE_CASE,
  WELCOME_FORM_HEADER,
} from "@appsmith/constants/messages";
import FormTextField from "components/ads/formFields/TextField";
import { DetailsFormValues } from "./SetupForm";
import { ButtonWrapper } from "pages/Applications/ForkModalStyles";
import Button, { Category, Size } from "components/ads/Button";
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

export default function DetailsForm(
  props: InjectedFormProps & DetailsFormValues & { onNext?: () => void },
) {
  const ref = React.createRef<HTMLDivElement>();

  return (
    <DetailsFormWrapper ref={ref}>
      <FormHeaderWrapper className="relative flex-col items-start">
        <FormHeaderIndex className="absolute -left-6">1.</FormHeaderIndex>
        <FormHeaderLabel>{createMessage(WELCOME_FORM_HEADER)}</FormHeaderLabel>
      </FormHeaderWrapper>
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
            component={withDropdown(roleOptions, "260px")}
            name="role"
            placeholder=""
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
            component={withDropdown(useCaseOptions, "260px")}
            name="useCase"
            placeholder=""
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
            category={Category.tertiary}
            className="t--welcome-form-next-button"
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
