import React from "react";
import { Button } from "@appsmith/ads";
import {
  WELCOME_FORM_USECASE_FIELD_NAME,
  WELCOME_NON_SUPER_FORM_NAME,
  WELCOME_FORM_PROFICIENCY_LEVEL,
} from "ee/constants/forms";
import {
  createMessage,
  WELCOME_ACTION,
  WELCOME_FORM_NON_SUPER_USER_USE_CASE,
  WELCOME_FORM_NON_SUPER_USER_PROFICIENCY_LEVEL,
  WELCOME_FORM_PROFICIENCY_ERROR_MESSAGE,
  WELCOME_FORM_USE_CASE_ERROR_MESSAGE,
  WELCOME_FORM_FULL_NAME,
  WELCOME_FORM_FULL_NAME_ERROR_MESSAGE,
} from "ee/constants/messages";
import { connect } from "react-redux";
import type { DefaultRootState } from "react-redux";
import type { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, reduxForm } from "redux-form";
import styled from "styled-components";
import { proficiencyOptions, useCaseOptions } from "./constants";
import RadioButtonGroup from "components/editorComponents/RadioButtonGroup";
import FormTextField from "components/utils/ReduxFormTextField";
import { useIsCloudBillingEnabled } from "hooks";

const ActionContainer = styled.div`
  margin-top: ${(props) => props.theme.spaces[15]}px;
`;

const StyledButton = styled(Button)`
  margin-top: ${(props) => props.theme.spaces[3]}px;
  width: 160px;
`;

const StyledFormTextField = styled(FormTextField)`
  .ads-v2-input__input {
    height: 36px;
    border-radius: var(--ads-v2-border-radius);
    padding: var(--ads-v2-spaces-3);
    font-size: var(--ads-font-size-4);
    width: 100%;
    box-sizing: border-box;
  }

  .ads-v2-input__label {
    font-size: var(--ads-font-size-4);
    font-weight: var(--ads-font-weight-bold-xl);
    color: var(--ads-v2-color-gray-700);
    margin-bottom: 0.5rem;
  }
`;

const InputSection = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[12]}px;
  margin-top: ${(props) => props.theme.spaces[10]}px;
  max-width: 505px;
`;

interface UserFormProps {
  onGetStarted?: (proficiency?: string, useCase?: string) => void;
}

interface NonSuperUserFormData {
  proficiency?: string;
  useCase?: string;
  fullName?: string;
}

export const Space = styled.div`
  height: 20px;
`;

const validate = (values: NonSuperUserFormData) => {
  const errors: Partial<NonSuperUserFormData> = {};

  if (!values.proficiency) {
    errors.proficiency = createMessage(WELCOME_FORM_PROFICIENCY_ERROR_MESSAGE);
  }

  if (!values.useCase) {
    errors.useCase = createMessage(WELCOME_FORM_USE_CASE_ERROR_MESSAGE);
  }

  if (!values.fullName) {
    errors.fullName = createMessage(WELCOME_FORM_FULL_NAME_ERROR_MESSAGE);
  }

  return errors;
};

function NonSuperUserProfilingQuestions(
  props: InjectedFormProps & UserFormProps & NonSuperUserFormData,
) {
  const isCloudBillingEnabled = useIsCloudBillingEnabled();

  const onSubmit = (data: NonSuperUserFormData) => {
    props.onGetStarted && props.onGetStarted(data.proficiency, data.useCase);
  };

  return (
    <form onSubmit={props.handleSubmit(onSubmit)}>
      {isCloudBillingEnabled && (
        <InputSection>
          <StyledFormTextField
            data-testid="t--user-full-name"
            label={createMessage(WELCOME_FORM_FULL_NAME)}
            name="fullName"
            placeholder="Enter your full name"
          />
        </InputSection>
      )}
      <Space />
      <Field
        component={RadioButtonGroup}
        label={createMessage(WELCOME_FORM_NON_SUPER_USER_PROFICIENCY_LEVEL)}
        name="proficiency"
        options={proficiencyOptions}
        showSubtitle
        testid="t--user-proficiency"
      />
      <Space />
      <Field
        component={RadioButtonGroup}
        label={createMessage(WELCOME_FORM_NON_SUPER_USER_USE_CASE)}
        name="useCase"
        options={useCaseOptions}
        testid="t--user-use-case"
      />
      <ActionContainer>
        <StyledButton
          className="w-full t--get-started-button"
          isDisabled={props.invalid}
          kind="primary"
          renderAs="button"
          size={"md"}
          type="submit"
        >
          {createMessage(WELCOME_ACTION)}
        </StyledButton>
      </ActionContainer>
    </form>
  );
}

const selector = formValueSelector(WELCOME_NON_SUPER_FORM_NAME);

export default connect((state: DefaultRootState) => {
  return {
    proficiency: selector(state, WELCOME_FORM_PROFICIENCY_LEVEL),
    useCase: selector(state, WELCOME_FORM_USECASE_FIELD_NAME),
  };
}, null)(
  reduxForm<NonSuperUserFormData, UserFormProps>({
    validate,
    form: WELCOME_NON_SUPER_FORM_NAME,
    touchOnBlur: true,
  })(NonSuperUserProfilingQuestions),
);
