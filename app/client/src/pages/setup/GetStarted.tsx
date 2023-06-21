import React from "react";
import { FormGroup as StyledFormGroup } from "design-system-old";
import { Button } from "design-system";
import FormTextField from "components/utils/ReduxFormTextField";
import {
  WELCOME_FORM_ROLE_FIELD_NAME,
  WELCOME_FORM_ROLE_NAME_FIELD_NAME,
  WELCOME_FORM_USECASE_FIELD_NAME,
  WELCOME_NON_SUPER_FORM_NAME,
} from "@appsmith/constants/forms";
import {
  createMessage,
  WELCOME_ACTION,
  WELCOME_FORM_NON_SUPER_USER_ROLE_DROPDOWN,
  WELCOME_FORM_NON_SUPER_USER_USE_CASE,
  WELCOME_FORM_ROLE,
} from "@appsmith/constants/messages";
import { connect } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import type { InjectedFormProps } from "redux-form";
import { Field, formValueSelector, reduxForm } from "redux-form";
import styled from "styled-components";
import { DropdownWrapper, withDropdown } from "./common";
import { roleOptions, useCaseOptions } from "./constants";
import SetupForm from "./SetupForm";

const ActionContainer = styled.div`
  margin-top: ${(props) => props.theme.spaces[15]}px;
`;

const StyledButton = styled(Button)`
  margin-top: ${(props) => props.theme.spaces[3]}px;
`;

type UserFormProps = {
  onGetStarted?: (role?: string, useCase?: string) => void;
};

type NonSuperUserFormData = {
  role?: string;
  useCase?: string;
  role_name?: string;
};

export function SuperUserForm() {
  return (
    <ActionContainer>
      <SetupForm />
    </ActionContainer>
  );
}

const StyledNonSuperUserForm = styled.form`
  width: 400px;
  margin-right: 3rem;
`;

const Space = styled.div`
  height: 20px;
`;

const validate = (values: any) => {
  const errors: any = {};

  if (!values.role) {
    errors.role = "Please select a role";
  }
  if (values.role === "other" && !values.role_name) {
    errors.role_name = "Please enter a role";
  }
  if (!values.useCase) {
    errors.useCase = "Please select an useCase";
  }

  return errors;
};

function NonSuperUser(
  props: InjectedFormProps & UserFormProps & NonSuperUserFormData,
) {
  const onSubmit = (data: NonSuperUserFormData) => {
    props.onGetStarted &&
      props.onGetStarted(
        data.role !== "other" ? data.role : props.role_name,
        data.useCase,
      );
  };

  return (
    <StyledNonSuperUserForm onSubmit={props.handleSubmit(onSubmit)}>
      <Space />
      <DropdownWrapper
        label={createMessage(WELCOME_FORM_NON_SUPER_USER_ROLE_DROPDOWN)}
      >
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
      <DropdownWrapper
        label={createMessage(WELCOME_FORM_NON_SUPER_USER_USE_CASE)}
      >
        <Field
          asyncControl
          component={withDropdown(useCaseOptions)}
          name="useCase"
          placeholder=""
          type="text"
        />
      </DropdownWrapper>
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
    </StyledNonSuperUserForm>
  );
}

const selector = formValueSelector(WELCOME_NON_SUPER_FORM_NAME);
export default connect((state: AppState) => {
  return {
    role: selector(state, WELCOME_FORM_ROLE_FIELD_NAME),
    role_name: selector(state, WELCOME_FORM_ROLE_NAME_FIELD_NAME),
    useCase: selector(state, WELCOME_FORM_USECASE_FIELD_NAME),
  };
}, null)(
  reduxForm<NonSuperUserFormData, UserFormProps>({
    validate,
    form: WELCOME_NON_SUPER_FORM_NAME,
    touchOnBlur: true,
  })(NonSuperUser),
);
