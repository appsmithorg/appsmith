import React from "react";
import { reduxForm, InjectedFormProps } from "redux-form";
import { AUTH_LOGIN_URL } from "constants/routes";
import { SIGNUP_FORM_NAME } from "constants/forms";
import { Link } from "react-router-dom";
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
  FORM_VALIDATION_PASSWORD_RULE,
} from "constants/messages";
import FormMessage from "components/editorComponents/form/FormMessage";
import FormGroup from "components/editorComponents/form/FormGroup";
import FormTextField from "components/editorComponents/form/FormTextField";
import ThirdPartyAuth, { SocialLoginTypes } from "./ThirdPartyAuth";
import Button from "components/editorComponents/Button";

import { isEmail, isStrongPassword, isEmptyString } from "utils/formhelpers";

import { signupFormSubmitHandler, SignupFormValues } from "./helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";

import { getAppsmithConfigs } from "configs";
const {
  enableGithubOAuth,
  enableGoogleOAuth,
  enableTNCPP,
} = getAppsmithConfigs();
const SocialLoginList: string[] = [];
if (enableGithubOAuth) SocialLoginList.push(SocialLoginTypes.GITHUB);
if (enableGoogleOAuth) SocialLoginList.push(SocialLoginTypes.GOOGLE);

export const TncPPLinks = () => {
  if (!enableTNCPP) return null;
  return (
    <>
      <Link target="_blank" to="/privacy-policy.html">
        {PRIVACY_POLICY_LINK}
      </Link>
      <Link target="_blank" to="/terms-and-conditions.html">
        {TERMS_AND_CONDITIONS_LINK}
      </Link>
    </>
  );
};

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
    valid,
  } = props;
  return (
    <AuthCardContainer>
      {submitSucceeded && (
        <FormMessage
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
      {submitFailed && error && <FormMessage intent="danger" message={error} />}
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
            <FormTextField
              name="email"
              type="email"
              placeholder={SIGNUP_PAGE_EMAIL_INPUT_PLACEHOLDER}
            />
          </FormGroup>
          <FormGroup
            intent={error ? "danger" : "none"}
            label={SIGNUP_PAGE_PASSWORD_INPUT_LABEL}
            helperText={FORM_VALIDATION_PASSWORD_RULE}
          >
            <FormTextField
              type="password"
              name="password"
              placeholder={SIGNUP_PAGE_PASSWORD_INPUT_PLACEHOLDER}
            />
          </FormGroup>
          <FormActions>
            <Button
              type="submit"
              disabled={pristine || !valid}
              loading={submitting}
              text={SIGNUP_PAGE_SUBMIT_BUTTON_TEXT}
              intent="primary"
              filled
              size="large"
              onClick={() => {
                AnalyticsUtil.logEvent("SIGNUP_CLICK", {
                  signupMethod: "EMAIL",
                });
              }}
            />
          </FormActions>
        </SpacedForm>
        {SocialLoginList.length > 0 && <Divider />}
        <ThirdPartyAuth type={"SIGNUP"} logins={SocialLoginList} />
      </AuthCardBody>
      <AuthCardFooter>
        <TncPPLinks></TncPPLinks>
      </AuthCardFooter>
      <AuthCardNavLink to={AUTH_LOGIN_URL}>
        {SIGNUP_PAGE_LOGIN_LINK_TEXT}
      </AuthCardNavLink>
    </AuthCardContainer>
  );
};

export default reduxForm<SignupFormValues>({
  validate,
  form: SIGNUP_FORM_NAME,
  touchOnBlur: true,
})(SignUp);
