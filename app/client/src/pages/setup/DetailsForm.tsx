import React, { useState } from "react";
import styled from "styled-components";
import { Field } from "redux-form";
import { DropdownWrapper, FormBodyWrapper, withDropdown } from "./common";
import {
  createMessage,
  WELCOME_FORM_EMAIL_ID,
  WELCOME_FORM_FIRST_NAME,
  WELCOME_FORM_LAST_NAME,
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
import { FormGroup as StyledFormGroup } from "design-system-old";
import { Button, Checkbox } from "design-system";
import { roleOptions, useCaseOptions } from "./constants";
import { Colors } from "constants/Colors";
import { isAirgapped } from "ce/utils/airgapHelpers";

const DetailsFormWrapper = styled.div`
  width: 100%;
  position: relative;
`;

const StyledFormBodyWrapper = styled(FormBodyWrapper)``;

const StyledTabIndicatorWrapper = styled.div`
  display: flex;
`;

const StyledTabIndicator = styled.div`
  width: 48px;
  background-color: var(--ads-color-brand);
  height: 3px;
  margin: 0 6px 0 0;
`;

export default function DetailsForm(
  props: SetupFormProps & { onNext?: () => void },
) {
  const ref = React.createRef<HTMLDivElement>();

  const [formState, setFormState] = useState(0);

  const isFirstPage = () => formState === 0;

  return (
    <DetailsFormWrapper ref={ref}>
      <StyledTabIndicatorWrapper>
        <StyledTabIndicator />
        <StyledTabIndicator
          style={isFirstPage() ? { backgroundColor: `${Colors.GRAY_300}` } : {}}
        />
      </StyledTabIndicatorWrapper>
      <StyledFormBodyWrapper>
        <div style={isFirstPage() ? { display: "block" } : { display: "none" }}>
          <div className="flex flex-row justify-between w-100">
            <StyledFormGroup
              className="!w-52 t--welcome-form-full-name test"
              label={createMessage(WELCOME_FORM_FIRST_NAME)}
            >
              <FormTextField
                autoFocus
                name="firstName"
                placeholder="John"
                type="text"
              />
            </StyledFormGroup>
            <StyledFormGroup
              className="!w-52 t--welcome-form-full-name"
              label={createMessage(WELCOME_FORM_LAST_NAME)}
            >
              <FormTextField name="lastName" placeholder="Doe" type="text" />
            </StyledFormGroup>
          </div>
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
                component={withDropdown(roleOptions, "100%")}
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
                component={withDropdown(useCaseOptions, "100%")}
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

            {!isAirgapped() && (
              <Checkbox
                defaultSelected={false}
                name="signupForNewsletter"
                value="true"
              >
                I want security and product updates.
              </Checkbox>
            )}
          </div>
        )}
        <ButtonWrapper>
          <Button
            className="t--welcome-form-next-button w-100"
            isDisabled={props.invalid}
            kind="primary"
            onClick={() => {
              if (isFirstPage()) setFormState(1);
            }}
            size="md"
            type={isFirstPage() ? "button" : "submit"}
          >
            {isFirstPage() ? "Continue" : "Get Started"}
          </Button>
        </ButtonWrapper>
      </StyledFormBodyWrapper>
    </DetailsFormWrapper>
  );
}
