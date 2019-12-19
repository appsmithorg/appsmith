import React from "react";
import { reduxForm, InjectedFormProps } from "redux-form";
import { AUTH_LOGIN_URL } from "constants/routes";
import { SIGNUP_FORM_NAME } from "constants/forms";
import { Link } from "react-router-dom";
import { Icon } from "@blueprintjs/core";
import Divider from "components/editorComponents/Divider";
import {
  AuthCardHeader,
  AuthCardBody,
  AuthCardFooter,
  AuthCardNavLink,
  SpacedForm,
  FormActions,
  AuthCardContainer,
} from "./StyledComponents";
import {
  SIGNUP_PAGE_TITLE,
  SIGNUP_PAGE_SUBTITLE,
  SIGNUP_PAGE_EMAIL_INPUT_LABEL,
  SIGNUP_PAGE_EMAIL_INPUT_PLACEHOLDER,
  SIGNUP_PAGE_PASSWORD_INPUT_LABEL,
  SIGNUP_PAGE_PASSWORD_INPUT_PLACEHOLDER,
  SIGNUP_PAGE_LOGIN_LINK_TEXT,
  FORM_VALIDATION_EMPTY_EMAIL,
  FORM_VALIDATION_EMPTY_PASSWORD,
  FORM_VALIDATION_INVALID_EMAIL,
  FORM_VALIDATION_INVALID_PASSWORD,
  SIGNUP_PAGE_SUBMIT_BUTTON_TEXT,
  PRIVACY_POLICY_LINK,
  TERMS_AND_CONDITIONS_LINK,
  SIGNUP_PAGE_SUCCESS,
  SIGNUP_PAGE_SUCCESS_LOGIN_BUTTON_TEXT,
} from "constants/messages";
import MessageTag from "components/editorComponents/form/MessageTag";
import FormGroup from "components/editorComponents/FormGroup";
import TextField from "components/editorComponents/form/fields/TextField";
import ThirdPartyAuth, { SocialLoginTypes } from "./ThirdPartyAuth";
import FormButton from "components/editorComponents/FormButton";

import { isEmail, isStrongPassword, isEmptyString } from "utils/formhelpers";

import { signupFormSubmitHandler, SignupFormValues } from "./helpers";

const validate = (values: SignupFormValues) => {
  const errors: SignupFormValues = {};
  if (!values.password || isEmptyString(values.password)) {
    errors.password = FORM_VALIDATION_EMPTY_PASSWORD;
  } else if (!isStrongPassword(values.password)) {
    errors.password = FORM_VALIDATION_INVALID_PASSWORD;
  }
  if (!values.email || isEmptyString(values.email)) {
    errors.email = FORM_VALIDATION_EMPTY_EMAIL;
  } else if (!isEmail(values.email)) {
    errors.email = FORM_VALIDATION_INVALID_EMAIL;
  }
  return errors;
};

export const SignUp = (props: InjectedFormProps<SignupFormValues>) => {
  const {
    error,
    handleSubmit,
    submitting,
    submitFailed,
    submitSucceeded,
    pristine,
  } = props;
  return (
    <AuthCardContainer>
      {submitSucceeded && (
        <MessageTag
          intent="success"
          message={SIGNUP_PAGE_SUCCESS}
          actions={[
            {
              url: AUTH_LOGIN_URL,
              text: SIGNUP_PAGE_SUCCESS_LOGIN_BUTTON_TEXT,
              intent: "success",
            },
          ]}
        />
      )}
      {submitFailed && error && <MessageTag intent="danger" message={error} />}
      <AuthCardHeader>
        <h1>{SIGNUP_PAGE_TITLE}</h1>
        <h5>{SIGNUP_PAGE_SUBTITLE}</h5>
      </AuthCardHeader>
      <AuthCardBody>
        <SpacedForm onSubmit={handleSubmit(signupFormSubmitHandler)}>
          <FormGroup
            intent={error ? "danger" : "none"}
            label={SIGNUP_PAGE_EMAIL_INPUT_LABEL}
          >
            <TextField
              name="email"
              type="email"
              placeholder={SIGNUP_PAGE_EMAIL_INPUT_PLACEHOLDER}
              showError
            />
          </FormGroup>
          <FormGroup
            intent={error ? "danger" : "none"}
            label={SIGNUP_PAGE_PASSWORD_INPUT_LABEL}
          >
            <TextField
              type="password"
              name="password"
              placeholder={SIGNUP_PAGE_PASSWORD_INPUT_PLACEHOLDER}
              showError
            />
          </FormGroup>
          <FormActions>
            <FormButton
              type="submit"
              disabled={pristine}
              loading={submitting}
              text={SIGNUP_PAGE_SUBMIT_BUTTON_TEXT}
              intent="primary"
            />
          </FormActions>
        </SpacedForm>
        <Divider />
        <ThirdPartyAuth
          logins={[SocialLoginTypes.GOOGLE, SocialLoginTypes.GITHUB]}
        />
      </AuthCardBody>

      <AuthCardNavLink to={AUTH_LOGIN_URL}>
        {SIGNUP_PAGE_LOGIN_LINK_TEXT}
        <Icon icon="arrow-right" intent="primary" />
      </AuthCardNavLink>
      <AuthCardFooter>
        <Link to="#">{PRIVACY_POLICY_LINK}</Link>
        <Link to="#">{TERMS_AND_CONDITIONS_LINK}</Link>
      </AuthCardFooter>
    </AuthCardContainer>
  );
};

export default reduxForm<SignupFormValues>({
  validate,
  form: SIGNUP_FORM_NAME,
  touchOnBlur: true,
})(SignUp);
