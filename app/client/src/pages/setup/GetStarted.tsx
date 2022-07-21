import Button from "components/ads/Button";
import StyledFormGroup from "components/ads/formFields/FormGroup";
import FormTextField from "components/ads/formFields/TextField";
import {
  WELCOME_FORM_ROLE_FIELD_NAME,
  WELCOME_FORM_ROLE_NAME_FIELD_NAME,
  WELCOME_FORM_USECASE_FIELD_NAME,
  WELCOME_NON_SUPER_FORM_NAME,
} from "constants/forms";
import {
  createMessage,
  WELCOME_ACTION,
  WELCOME_FORM_NON_SUPER_USER_ROLE_DROPDOWN,
  WELCOME_FORM_NON_SUPER_USER_USE_CASE,
  WELCOME_FORM_ROLE,
} from "@appsmith/constants/messages";
import React from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import {
  Field,
  formValueSelector,
  InjectedFormProps,
  reduxForm,
} from "redux-form";
import styled from "styled-components";
import { DropdownWrapper, withDropdown } from "./common";
import { roleOptions, useCaseOptions } from "./constants";

const ActionContainer = styled.div`
  margin-top: ${(props) => props.theme.spaces[15]}px;
`;

const StyledButton = styled(Button)`
  width: 136px;
  height: 38px;
  font-size: 13px;
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

export function SuperUserForm(props: UserFormProps) {
  return (
    <ActionContainer>
      <StyledButton
        className="t--welcome-form-get-started"
        onClick={() => props.onGetStarted && props.onGetStarted()}
        text={createMessage(WELCOME_ACTION)}
      />
    </ActionContainer>
  );
}

const StyledNonSuperUserForm = styled.form`
  width: 400px;
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

const DROPDOWN_WIDTH = "400px";

function NonSuperUser(
  props: InjectedFormProps & UserFormProps & NonSuperUserFormData,
) {
  return (
    <StyledNonSuperUserForm>
      <Space />
      <DropdownWrapper
        label={createMessage(WELCOME_FORM_NON_SUPER_USER_ROLE_DROPDOWN)}
      >
        <Field
          asyncControl
          component={withDropdown(roleOptions, DROPDOWN_WIDTH)}
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
          component={withDropdown(useCaseOptions, DROPDOWN_WIDTH)}
          name="useCase"
          placeholder=""
          type="text"
        />
      </DropdownWrapper>
      <ActionContainer>
        <StyledButton
          className="t--get-started-button"
          disabled={props.invalid}
          onClick={() =>
            props.onGetStarted &&
            props.onGetStarted(
              props.role !== "other" ? props.role : props.role_name,
              props.useCase,
            )
          }
          text={createMessage(WELCOME_ACTION)}
        />
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
