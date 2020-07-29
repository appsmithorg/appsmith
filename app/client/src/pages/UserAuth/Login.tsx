import React from "react";
import { Link, useLocation } from "react-router-dom";
import { connect } from "react-redux";
import { InjectedFormProps, reduxForm, formValueSelector } from "redux-form";
import {
  LOGIN_FORM_NAME,
  LOGIN_FORM_EMAIL_FIELD_NAME,
  LOGIN_FORM_PASSWORD_FIELD_NAME,
} from "constants/forms";
import { FORGOT_PASSWORD_URL, SIGN_UP_URL } from "constants/routes";
import {
  LOGIN_PAGE_SUBTITLE,
  LOGIN_PAGE_TITLE,
  LOGIN_PAGE_EMAIL_INPUT_LABEL,
  LOGIN_PAGE_PASSWORD_INPUT_LABEL,
  LOGIN_PAGE_PASSWORD_INPUT_PLACEHOLDER,
  LOGIN_PAGE_EMAIL_INPUT_PLACEHOLDER,
  FORM_VALIDATION_EMPTY_EMAIL,
  FORM_VALIDATION_EMPTY_PASSWORD,
  FORM_VALIDATION_INVALID_EMAIL,
  FORM_VALIDATION_INVALID_PASSWORD,
  LOGIN_PAGE_LOGIN_BUTTON_TEXT,
  LOGIN_PAGE_FORGOT_PASSWORD_TEXT,
  LOGIN_PAGE_SIGN_UP_LINK_TEXT,
  LOGIN_PAGE_INVALID_CREDS_ERROR,
  LOGIN_PAGE_INVALID_CREDS_FORGOT_PASSWORD_LINK,
  FORM_VALIDATION_PASSWORD_RULE,
} from "constants/messages";
import Divider from "components/editorComponents/Divider";
import FormMessage from "components/editorComponents/form/FormMessage";
import FormGroup from "components/editorComponents/form/FormGroup";
import FormTextField from "components/editorComponents/form/FormTextField";
import Button from "components/editorComponents/Button";
import ThirdPartyAuth, { SocialLoginTypes } from "./ThirdPartyAuth";
import { isEmail, isStrongPassword, isEmptyString } from "utils/formhelpers";
import { LoginFormValues } from "./helpers";

import {
  AuthCardContainer,
  SpacedSubmitForm,
  FormActions,
  AuthCardHeader,
  AuthCardFooter,
  AuthCardNavLink,
  AuthCardBody,
} from "./StyledComponents";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppsmithConfigs } from "configs";
import { TncPPLinks } from "./SignUp";
import { LOGIN_SUBMIT_PATH } from "constants/ApiConstants";
const { enableGithubOAuth, enableGoogleOAuth } = getAppsmithConfigs();

const validate = (values: LoginFormValues) => {
  const errors: LoginFormValues = {};
  const email = values[LOGIN_FORM_EMAIL_FIELD_NAME];
  const password = values[LOGIN_FORM_PASSWORD_FIELD_NAME];
  if (!password || isEmptyString(password)) {
    errors[LOGIN_FORM_PASSWORD_FIELD_NAME] = FORM_VALIDATION_EMPTY_PASSWORD;
  } else if (!isStrongPassword(password)) {
    errors[LOGIN_FORM_PASSWORD_FIELD_NAME] = FORM_VALIDATION_INVALID_PASSWORD;
  }
  if (!email || isEmptyString(email)) {
    errors[LOGIN_FORM_EMAIL_FIELD_NAME] = FORM_VALIDATION_EMPTY_EMAIL;
  } else if (!isEmail(email)) {
    errors[LOGIN_FORM_EMAIL_FIELD_NAME] = FORM_VALIDATION_INVALID_EMAIL;
  }

  return errors;
};

type LoginFormProps = { emailValue: string } & InjectedFormProps<
  LoginFormValues,
  { emailValue: string }
>;

const SocialLoginList: string[] = [];
if (enableGithubOAuth) SocialLoginList.push(SocialLoginTypes.GITHUB);
if (enableGoogleOAuth) SocialLoginList.push(SocialLoginTypes.GOOGLE);

export const Login = (props: LoginFormProps) => {
  const { error, valid } = props;
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  let showError = false;
  if (queryParams.get("error")) {
    showError = true;
  }

  let loginURL = "/api/v1/" + LOGIN_SUBMIT_PATH;
  if (queryParams.has("redirectTo")) {
    loginURL += `?redirectUrl=${queryParams.get("redirectTo")}`;
  }

  let forgotPasswordURL = `${FORGOT_PASSWORD_URL}`;
  if (props.emailValue && !isEmptyString(props.emailValue)) {
    forgotPasswordURL += `?email=${props.emailValue}`;
  }

  return (
    <AuthCardContainer>
      {showError && (
        <FormMessage
          intent="danger"
          message={LOGIN_PAGE_INVALID_CREDS_ERROR}
          actions={[
            {
              url: FORGOT_PASSWORD_URL,
              text: LOGIN_PAGE_INVALID_CREDS_FORGOT_PASSWORD_LINK,
              intent: "success",
            },
          ]}
        />
      )}
      <AuthCardHeader>
        <h1>{LOGIN_PAGE_TITLE}</h1>
        <h5>{LOGIN_PAGE_SUBTITLE}</h5>
      </AuthCardHeader>
      <AuthCardBody>
        <SpacedSubmitForm method="POST" action={loginURL}>
          <FormGroup
            intent={error ? "danger" : "none"}
            label={LOGIN_PAGE_EMAIL_INPUT_LABEL}
          >
            <FormTextField
              name={LOGIN_FORM_EMAIL_FIELD_NAME}
              type="email"
              placeholder={LOGIN_PAGE_EMAIL_INPUT_PLACEHOLDER}
            />
          </FormGroup>
          <FormGroup
            intent={error ? "danger" : "none"}
            label={LOGIN_PAGE_PASSWORD_INPUT_LABEL}
            helperText={FORM_VALIDATION_PASSWORD_RULE}
          >
            <FormTextField
              type="password"
              name={LOGIN_FORM_PASSWORD_FIELD_NAME}
              placeholder={LOGIN_PAGE_PASSWORD_INPUT_PLACEHOLDER}
            />
          </FormGroup>
          <Link to={forgotPasswordURL}>{LOGIN_PAGE_FORGOT_PASSWORD_TEXT}</Link>
          <FormActions>
            <Button
              type="submit"
              disabled={!valid}
              text={LOGIN_PAGE_LOGIN_BUTTON_TEXT}
              intent="primary"
              filled
              size="large"
              onClick={() => {
                AnalyticsUtil.logEvent("LOGIN_CLICK", {
                  loginMethod: "EMAIL",
                });
              }}
            />
          </FormActions>
        </SpacedSubmitForm>
        {SocialLoginList.length > 0 && <Divider />}
        <ThirdPartyAuth type={"SIGNIN"} logins={SocialLoginList} />
      </AuthCardBody>
      <AuthCardNavLink to={SIGN_UP_URL}>
        {LOGIN_PAGE_SIGN_UP_LINK_TEXT}
      </AuthCardNavLink>
      <AuthCardFooter>
        <TncPPLinks />
      </AuthCardFooter>
    </AuthCardContainer>
  );
};

const selector = formValueSelector(LOGIN_FORM_NAME);
export default connect(state => ({
  emailValue: selector(state, LOGIN_FORM_EMAIL_FIELD_NAME),
}))(
  reduxForm<LoginFormValues, { emailValue: string }>({
    validate,
    touchOnBlur: true,
    form: LOGIN_FORM_NAME,
  })(Login),
);
