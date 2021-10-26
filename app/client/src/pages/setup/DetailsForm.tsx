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
  WELCOME_FORM_HEADER,
} from "constants/messages";
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
            component={withDropdown(roleOptions, "260px")}
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
            component={withDropdown(useCaseOptions, "260px")}
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
