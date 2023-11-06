import React from "react";
import { Button } from "design-system";
import {
  WELCOME_FORM_USECASE_FIELD_NAME,
  WELCOME_NON_SUPER_FORM_NAME,
  WELCOME_FORM_PROFICIENCY_LEVEL,
} from "@appsmith/constants/forms";
import {
  createMessage,
  WELCOME_ACTION,
  WELCOME_FORM_NON_SUPER_USER_USE_CASE,
  WELCOME_FORM_NON_SUPER_USER_PROFICIENCY_LEVEL,
  WELCOME_FORM_PROFICIENCY_ERROR_MESSAGE,
  WELCOME_FORM_USE_CASE_ERROR_MESSAGE,
} from "@appsmith/constants/messages";
import { connect } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import type { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, reduxForm } from "redux-form";
import styled from "styled-components";
import { proficiencyOptions, useCaseOptionsForNonSuperUser } from "./constants";
import SetupForm from "./SetupForm";
import RadioButtonGroup from "components/editorComponents/RadioButtonGroup";

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

export function SuperUserForm() {
  return (
    <ActionContainer>
      <SetupForm />
    </ActionContainer>
  );
}

export const Space = styled.div`
  height: 40px;
`;

const validate = (values: any) => {
  const errors: any = {};

  if (!values.proficiency) {
    errors.proficiency = createMessage(WELCOME_FORM_PROFICIENCY_ERROR_MESSAGE);
  }

  if (!values.useCase) {
    errors.useCase = createMessage(WELCOME_FORM_USE_CASE_ERROR_MESSAGE);
  }

  return errors;
};

function NonSuperUser(
  props: InjectedFormProps & UserFormProps & NonSuperUserFormData,
) {
  const onSubmit = (data: NonSuperUserFormData) => {
    props.onGetStarted && props.onGetStarted(data.proficiency, data.useCase);
  };

  return (
    <form onSubmit={props.handleSubmit(onSubmit)}>
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
        options={useCaseOptionsForNonSuperUser}
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
  })(NonSuperUser),
);
