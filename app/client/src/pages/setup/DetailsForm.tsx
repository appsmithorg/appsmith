import React, { useState } from "react";
import styled from "styled-components";
import { Field } from "redux-form";
import { DropdownWrapper, FormBodyWrapper, withDropdown } from "./common";
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
  WELCOME_FORM_ROLE_DROPDOWN_PLACEHOLDER,
  WELCOME_FORM_USE_CASE_PLACEHOLDER,
} from "@appsmith/constants/messages";
import FormTextField from "components/utils/ReduxFormTextField";
import type { SetupFormProps } from "./SetupForm";
import { ButtonWrapper } from "pages/Applications/ForkModalStyles";
import {
  Button,
  Category,
  FormGroup as StyledFormGroup,
  Size,
} from "design-system-old";
import { roleOptions, useCaseOptions } from "./constants";

const DetailsFormWrapper = styled.div`
  width: 100%;
  position: relative;
`;

const StyledFormBodyWrapper = styled(FormBodyWrapper)`
  width: 260px;
`;

export default function DetailsForm(
  props: SetupFormProps & { onNext?: () => void },
) {
  const ref = React.createRef<HTMLDivElement>();

  const [formState, setFormState] = useState(0);

  const isFirstPage = () => formState === 0;

  return (
    <DetailsFormWrapper ref={ref}>
      <StyledFormBodyWrapper>
        <div style={isFirstPage() ? { display: "block" } : { display: "none" }}>
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
        </div>

        {!isFirstPage() && (
          <div>
            <DropdownWrapper
              className="t--welcome-form-role-dropdown"
              label={createMessage(WELCOME_FORM_ROLE_DROPDOWN)}
            >
              <Field
                asyncControl
                component={withDropdown(roleOptions, "260px")}
                name="role"
                placeholder={createMessage(
                  WELCOME_FORM_ROLE_DROPDOWN_PLACEHOLDER,
                )}
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
                placeholder={createMessage(WELCOME_FORM_USE_CASE_PLACEHOLDER)}
                type="text"
              />
            </DropdownWrapper>
            {props.useCase == "other" && (
              <StyledFormGroup
                className="t--welcome-form-use-case-input"
                label={createMessage(WELCOME_FORM_CUSTOM_USE_CASE)}
              >
                <FormTextField
                  name="custom_useCase"
                  placeholder=""
                  type="text"
                />
              </StyledFormGroup>
            )}
          </div>
        )}
        <ButtonWrapper>
          <Button
            category={Category.primary}
            className="t--welcome-form-next-button"
            disabled={props.invalid}
            onClick={() => {
              if (isFirstPage()) setFormState(1);
            }}
            size={Size.large}
            tag="button"
            text={isFirstPage() ? "Continue" : "Get Started"}
            type={isFirstPage() ? "button" : "submit"}
            width="100%"
          />
        </ButtonWrapper>
      </StyledFormBodyWrapper>
    </DetailsFormWrapper>
  );
}
