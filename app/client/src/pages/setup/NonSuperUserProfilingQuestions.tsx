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
} from "ee/constants/messages";
import { connect } from "react-redux";
import type { AppState } from "ee/reducers";
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

interface UserFormProps {
  onGetStarted?: (proficiency?: string, useCase?: string) => void;
}

interface NonSuperUserFormData {
  proficiency?: string;
  useCase?: string;
}

export const Space = styled.div`
  height: 40px;
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validate = (values: any) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errors: any = {};

  if (!values.proficiency) {
    errors.proficiency = createMessage(WELCOME_FORM_PROFICIENCY_ERROR_MESSAGE);
  }

  if (!values.useCase) {
    errors.useCase = createMessage(WELCOME_FORM_USE_CASE_ERROR_MESSAGE);
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
        <>
          <Space />
          <FormTextField
            data-testid="t--user-full-name"
            label={createMessage(WELCOME_FORM_FULL_NAME)}
            name="fullName"
            placeholder="Enter your full name"
          />
          <Space />
        </>
      )}
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

export default connect((state: AppState) => {
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
