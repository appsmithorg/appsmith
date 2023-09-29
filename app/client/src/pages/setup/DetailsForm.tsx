import React, { useEffect } from "react";
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
  WELCOME_FORM_CUSTOM_USE_CASE,
  WELCOME_FORM_USE_CASE_PLACEHOLDER,
  CONTINUE,
  ONBOARDING_STATUS_GET_STARTED,
  WELCOME_FORM_NON_SUPER_USER_PROFICIENCY_LEVEL,
  WELCOME_FORM_NON_SUPER_USER_USE_CASE,
} from "@appsmith/constants/messages";
import FormTextField from "components/utils/ReduxFormTextField";
import type { SetupFormProps } from "./SetupForm";
import { ButtonWrapper } from "pages/Applications/ForkModalStyles";
import { FormGroup } from "design-system-old";
import { Button, Checkbox } from "design-system";
import { proficiencyOptions, useCaseOptions } from "./constants";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { setFirstTimeUserOnboardingTelemetryCalloutVisibility } from "utils/storage";
import RadioButtonGroup from "components/editorComponents/RadioButtonGroup";
import { Space } from "./GetStarted";

const DetailsFormWrapper = styled.div`
  width: 100%;
  position: relative;
`;

const StyledFormBodyWrapper = styled(FormBodyWrapper)``;

const StyledTabIndicatorWrapper = styled.div`
  display: flex;
`;

const StyledTabIndicator = styled.div<{ isFirstPage?: boolean }>`
  width: 48px;
  height: 3px;
  margin: 0 6px 0 0;
  background-color: ${(props) =>
    props.isFirstPage
      ? `var(--ads-v2-color-bg-emphasis);`
      : `var(--ads-v2-color-bg-brand);`};
`;

const StyledFormGroup = styled(FormGroup)`
  && > .bp3-label {
    color: var(--ads-v2-color-fg);
  }
`;

export default function DetailsForm(
  props: SetupFormProps & { isFirstPage: boolean } & {
    toggleFormPage: () => void;
  },
) {
  const ref = React.createRef<HTMLDivElement>();

  useEffect(() => {
    const setTelemetryVisibleFalse = async () => {
      await setFirstTimeUserOnboardingTelemetryCalloutVisibility(false);
    };
    setTelemetryVisibleFalse();
  }, []);

  return (
    <DetailsFormWrapper ref={ref}>
      <StyledTabIndicatorWrapper>
        <StyledTabIndicator />
        <StyledTabIndicator isFirstPage={props.isFirstPage} />
      </StyledTabIndicatorWrapper>
      <StyledFormBodyWrapper>
        <div
          className={props.isFirstPage ? "block" : "hidden"}
          data-testid="formPage"
        >
          <div className="flex flex-row justify-between w-100">
            <StyledFormGroup className="!w-52 t--welcome-form-first-name">
              <FormTextField
                autoFocus
                data-testid="firstName"
                label={createMessage(WELCOME_FORM_FIRST_NAME)}
                name="firstName"
                placeholder="John"
                type="text"
              />
            </StyledFormGroup>

            <StyledFormGroup className="!w-52 t--welcome-form-last-name">
              <FormTextField
                data-testid="lastName"
                label={createMessage(WELCOME_FORM_LAST_NAME)}
                name="lastName"
                placeholder="Doe"
                type="text"
              />
            </StyledFormGroup>
          </div>
          <StyledFormGroup className="t--welcome-form-email">
            <FormTextField
              data-testid="email"
              label={createMessage(WELCOME_FORM_EMAIL_ID)}
              name="email"
              placeholder="How can we reach you?"
              type="email"
            />
          </StyledFormGroup>
          <StyledFormGroup className="t--welcome-form-password">
            <FormTextField
              data-testid="password"
              label={createMessage(WELCOME_FORM_CREATE_PASSWORD)}
              name="password"
              placeholder="Make it strong!"
              type="password"
            />
          </StyledFormGroup>
          <StyledFormGroup className="t--welcome-form-verify-password">
            <FormTextField
              data-testid="verifyPassword"
              label={createMessage(WELCOME_FORM_VERIFY_PASSWORD)}
              name="verifyPassword"
              placeholder="Type correctly"
              type="password"
            />
          </StyledFormGroup>
        </div>

        {!props.isFirstPage && (
          <div>
            <Field
              component={RadioButtonGroup}
              label={createMessage(
                WELCOME_FORM_NON_SUPER_USER_PROFICIENCY_LEVEL,
              )}
              name="proficiency"
              options={proficiencyOptions}
            />
            <Space />
            <DropdownWrapper
              className="t--welcome-form-role-usecase"
              label={createMessage(WELCOME_FORM_NON_SUPER_USER_USE_CASE)}
            >
              <Field
                asyncControl
                component={withDropdown(useCaseOptions)}
                data-testid="useCase"
                name="useCase"
                placeholder={createMessage(WELCOME_FORM_USE_CASE_PLACEHOLDER)}
                type="text"
              />
            </DropdownWrapper>
            {props.useCase == "other" && (
              <StyledFormGroup className="t--welcome-form-use-case-input">
                <FormTextField
                  label={createMessage(WELCOME_FORM_CUSTOM_USE_CASE)}
                  name="custom_useCase"
                  placeholder=""
                  type="text"
                />
              </StyledFormGroup>
            )}

            {!isAirgapped() && (
              <Checkbox defaultSelected name="signupForNewsletter" value="true">
                I want security and product updates.
              </Checkbox>
            )}
          </div>
        )}
        {props.isFirstPage && (
          <ButtonWrapper>
            <Button
              className="t--welcome-form-continue-button w-100"
              isDisabled={props.invalid}
              kind="primary"
              onClick={() => {
                props.toggleFormPage();
              }}
              size="md"
              type="button"
            >
              {createMessage(CONTINUE)}
            </Button>
          </ButtonWrapper>
        )}
        {!props.isFirstPage && (
          <ButtonWrapper>
            <Button
              className="t--welcome-form-submit-button w-100"
              isDisabled={props.invalid}
              kind="primary"
              size="md"
              type="submit"
            >
              {createMessage(ONBOARDING_STATUS_GET_STARTED)}
            </Button>
          </ButtonWrapper>
        )}
      </StyledFormBodyWrapper>
    </DetailsFormWrapper>
  );
}
