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
  LOGIN_PAGE_TITLE,
  LOGIN_PAGE_EMAIL_INPUT_LABEL,
  LOGIN_PAGE_PASSWORD_INPUT_LABEL,
  LOGIN_PAGE_PASSWORD_INPUT_PLACEHOLDER,
  LOGIN_PAGE_EMAIL_INPUT_PLACEHOLDER,
  FORM_VALIDATION_EMPTY_PASSWORD,
  FORM_VALIDATION_INVALID_EMAIL,
  FORM_VALIDATION_INVALID_PASSWORD,
  LOGIN_PAGE_LOGIN_BUTTON_TEXT,
  LOGIN_PAGE_FORGOT_PASSWORD_TEXT,
  LOGIN_PAGE_SIGN_UP_LINK_TEXT,
  LOGIN_PAGE_INVALID_CREDS_ERROR,
  LOGIN_PAGE_INVALID_CREDS_FORGOT_PASSWORD_LINK,
  NEW_TO_APPSMITH,
  createMessage,
} from "constants/messages";
import FormMessage from "components/ads/formFields/FormMessage";
import FormGroup from "components/ads/formFields/FormGroup";
import FormTextField from "components/ads/formFields/TextField";
import Button, { Size } from "components/ads/Button";
import ThirdPartyAuth, { SocialLoginTypes } from "./ThirdPartyAuth";
import { isEmail, isStrongPassword, isEmptyString } from "utils/formhelpers";
import { LoginFormValues } from "./helpers";
import { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";

import {
  SpacedSubmitForm,
  FormActions,
  AuthCardHeader,
  AuthCardNavLink,
  SignUpLinkSection,
  ForgotPasswordLink,
} from "./StyledComponents";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppsmithConfigs } from "configs";
import { LOGIN_SUBMIT_PATH } from "constants/ApiConstants";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
const { enableGithubOAuth, enableGoogleOAuth } = getAppsmithConfigs();

const validate = (values: LoginFormValues) => {
  const errors: LoginFormValues = {};
  const email = values[LOGIN_FORM_EMAIL_FIELD_NAME] || "";
  const password = values[LOGIN_FORM_PASSWORD_FIELD_NAME];
  if (!password || isEmptyString(password)) {
    errors[LOGIN_FORM_PASSWORD_FIELD_NAME] = createMessage(
      FORM_VALIDATION_EMPTY_PASSWORD,
    );
  } else if (!isStrongPassword(password)) {
    errors[LOGIN_FORM_PASSWORD_FIELD_NAME] = createMessage(
      FORM_VALIDATION_INVALID_PASSWORD,
    );
  }
  if (!isEmptyString(email) && !isEmail(email)) {
    errors[LOGIN_FORM_EMAIL_FIELD_NAME] = createMessage(
      FORM_VALIDATION_INVALID_EMAIL,
    );
  }

  return errors;
};

type LoginFormProps = { emailValue: string } & InjectedFormProps<
  LoginFormValues,
  { emailValue: string }
> & {
    theme: Theme;
  };

const SocialLoginList: string[] = [];
if (enableGoogleOAuth) SocialLoginList.push(SocialLoginTypes.GOOGLE);
if (enableGithubOAuth) SocialLoginList.push(SocialLoginTypes.GITHUB);

export const Login = (props: LoginFormProps) => {
  const { error, valid, emailValue: email } = props;
  const isFormValid = valid && email && !isEmptyString(email);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  let showError = false;
  if (queryParams.get("error")) {
    showError = true;
  }

  let loginURL = "/api/v1/" + LOGIN_SUBMIT_PATH;
  let signupURL = SIGN_UP_URL;
  if (queryParams.has("redirectUrl")) {
    loginURL += `?redirectUrl=${queryParams.get("redirectUrl")}`;
    signupURL += `?redirectUrl=${queryParams.get("redirectUrl")}`;
  }

  let forgotPasswordURL = `${FORGOT_PASSWORD_URL}`;
  if (props.emailValue && !isEmptyString(props.emailValue)) {
    forgotPasswordURL += `?email=${props.emailValue}`;
  }

  return (
    <>
      <AuthCardHeader>
        <h1>{createMessage(LOGIN_PAGE_TITLE)}</h1>
      </AuthCardHeader>
      <SignUpLinkSection>
        {createMessage(NEW_TO_APPSMITH)}
        <AuthCardNavLink
          to={signupURL}
          style={{ marginLeft: props.theme.spaces[3] }}
        >
          {createMessage(LOGIN_PAGE_SIGN_UP_LINK_TEXT)}
        </AuthCardNavLink>
      </SignUpLinkSection>
      {showError && (
        <FormMessage
          intent="warning"
          message={createMessage(LOGIN_PAGE_INVALID_CREDS_ERROR)}
          actions={[
            {
              url: FORGOT_PASSWORD_URL,
              text: createMessage(
                LOGIN_PAGE_INVALID_CREDS_FORGOT_PASSWORD_LINK,
              ),
              intent: "success",
            },
          ]}
        />
      )}
      {SocialLoginList.length > 0 && (
        <ThirdPartyAuth type={"SIGNIN"} logins={SocialLoginList} />
      )}
      <SpacedSubmitForm method="POST" action={loginURL}>
        <FormGroup
          intent={error ? "danger" : "none"}
          label={createMessage(LOGIN_PAGE_EMAIL_INPUT_LABEL)}
        >
          <FormTextField
            name={LOGIN_FORM_EMAIL_FIELD_NAME}
            type="email"
            placeholder={createMessage(LOGIN_PAGE_EMAIL_INPUT_PLACEHOLDER)}
            autoFocus
          />
        </FormGroup>
        <FormGroup
          intent={error ? "danger" : "none"}
          label={createMessage(LOGIN_PAGE_PASSWORD_INPUT_LABEL)}
        >
          <FormTextField
            type="password"
            name={LOGIN_FORM_PASSWORD_FIELD_NAME}
            placeholder={createMessage(LOGIN_PAGE_PASSWORD_INPUT_PLACEHOLDER)}
          />
        </FormGroup>

        <FormActions>
          <Button
            tag="button"
            type="submit"
            disabled={!isFormValid}
            text={createMessage(LOGIN_PAGE_LOGIN_BUTTON_TEXT)}
            fill
            size={Size.large}
            onClick={() => {
              PerformanceTracker.startTracking(
                PerformanceTransactionName.LOGIN_CLICK,
              );
              AnalyticsUtil.logEvent("LOGIN_CLICK", {
                loginMethod: "EMAIL",
              });
            }}
          />
        </FormActions>
      </SpacedSubmitForm>
      <ForgotPasswordLink>
        <Link to={forgotPasswordURL}>
          {createMessage(LOGIN_PAGE_FORGOT_PASSWORD_TEXT)}
        </Link>
      </ForgotPasswordLink>
    </>
  );
};

const selector = formValueSelector(LOGIN_FORM_NAME);
export default connect((state) => ({
  emailValue: selector(state, LOGIN_FORM_EMAIL_FIELD_NAME),
}))(
  reduxForm<LoginFormValues, { emailValue: string }>({
    validate,
    touchOnBlur: true,
    form: LOGIN_FORM_NAME,
  })(withTheme(Login)),
);
