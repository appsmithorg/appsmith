import React from "react";
import { Link, Redirect, useLocation } from "react-router-dom";
import { connect, useSelector } from "react-redux";
import { InjectedFormProps, reduxForm, formValueSelector } from "redux-form";
import {
  LOGIN_FORM_NAME,
  LOGIN_FORM_EMAIL_FIELD_NAME,
  LOGIN_FORM_PASSWORD_FIELD_NAME,
} from "constants/forms";
import { FORGOT_PASSWORD_URL, SETUP, SIGN_UP_URL } from "constants/routes";
import {
  LOGIN_PAGE_TITLE,
  LOGIN_PAGE_EMAIL_INPUT_LABEL,
  LOGIN_PAGE_PASSWORD_INPUT_LABEL,
  LOGIN_PAGE_PASSWORD_INPUT_PLACEHOLDER,
  LOGIN_PAGE_EMAIL_INPUT_PLACEHOLDER,
  FORM_VALIDATION_EMPTY_PASSWORD,
  FORM_VALIDATION_INVALID_EMAIL,
  LOGIN_PAGE_LOGIN_BUTTON_TEXT,
  LOGIN_PAGE_FORGOT_PASSWORD_TEXT,
  LOGIN_PAGE_SIGN_UP_LINK_TEXT,
  LOGIN_PAGE_INVALID_CREDS_ERROR,
  LOGIN_PAGE_INVALID_CREDS_FORGOT_PASSWORD_LINK,
  NEW_TO_APPSMITH,
  createMessage,
} from "@appsmith/constants/messages";
import FormMessage from "components/ads/formFields/FormMessage";
import FormGroup from "components/ads/formFields/FormGroup";
import FormTextField from "components/ads/formFields/TextField";
import Button, { Size } from "components/ads/Button";
import ThirdPartyAuth from "@appsmith/pages/UserAuth/ThirdPartyAuth";
import { ThirdPartyLoginRegistry } from "pages/UserAuth/ThirdPartyLoginRegistry";
import { isEmail, isEmptyString } from "utils/formhelpers";
import { LoginFormValues } from "pages/UserAuth/helpers";
import { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";

import {
  SpacedSubmitForm,
  FormActions,
  AuthCardHeader,
  AuthCardNavLink,
  SignUpLinkSection,
  ForgotPasswordLink,
} from "pages/UserAuth/StyledComponents";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppsmithConfigs } from "@appsmith/configs";
import { LOGIN_SUBMIT_PATH } from "@appsmith/constants/ApiConstants";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { getIsSafeRedirectURL } from "utils/helpers";
import { getCurrentUser } from "selectors/usersSelectors";
const { disableLoginForm, disableSignup } = getAppsmithConfigs();

const validate = (values: LoginFormValues) => {
  const errors: LoginFormValues = {};
  const email = values[LOGIN_FORM_EMAIL_FIELD_NAME] || "";
  const password = values[LOGIN_FORM_PASSWORD_FIELD_NAME];
  if (!password || isEmptyString(password)) {
    errors[LOGIN_FORM_PASSWORD_FIELD_NAME] = createMessage(
      FORM_VALIDATION_EMPTY_PASSWORD,
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

export function Login(props: LoginFormProps) {
  const { emailValue: email, error, valid } = props;
  const isFormValid = valid && email && !isEmptyString(email);
  const location = useLocation();
  const socialLoginList = ThirdPartyLoginRegistry.get();
  const queryParams = new URLSearchParams(location.search);
  let showError = false;
  const currentUser = useSelector(getCurrentUser);
  if (currentUser?.emptyInstance) {
    return <Redirect to={SETUP} />;
  }
  if (queryParams.get("error")) {
    showError = true;
  }
  const errorMsg = showError && queryParams.get("message");

  let loginURL = "/api/v1/" + LOGIN_SUBMIT_PATH;
  let signupURL = SIGN_UP_URL;
  const redirectUrl = queryParams.get("redirectUrl");
  if (redirectUrl != null && getIsSafeRedirectURL(redirectUrl)) {
    const encodedRedirectUrl = encodeURIComponent(redirectUrl);
    loginURL += `?redirectUrl=${encodedRedirectUrl}`;
    signupURL += `?redirectUrl=${encodedRedirectUrl}`;
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
      {!disableSignup && (
        <SignUpLinkSection>
          {createMessage(NEW_TO_APPSMITH)}
          <AuthCardNavLink
            style={{ marginLeft: props.theme.spaces[3] }}
            to={signupURL}
          >
            {createMessage(LOGIN_PAGE_SIGN_UP_LINK_TEXT)}
          </AuthCardNavLink>
        </SignUpLinkSection>
      )}
      {showError && (
        <FormMessage
          actions={
            !!errorMsg
              ? []
              : [
                  {
                    url: FORGOT_PASSWORD_URL,
                    text: createMessage(
                      LOGIN_PAGE_INVALID_CREDS_FORGOT_PASSWORD_LINK,
                    ),
                    intent: "success",
                  },
                ]
          }
          intent="danger"
          message={
            !!errorMsg
              ? errorMsg
              : createMessage(LOGIN_PAGE_INVALID_CREDS_ERROR)
          }
        />
      )}
      {socialLoginList.length > 0 && (
        <ThirdPartyAuth logins={socialLoginList} type={"SIGNIN"} />
      )}
      {!disableLoginForm && (
        <>
          <SpacedSubmitForm action={loginURL} method="POST">
            <FormGroup
              intent={error ? "danger" : "none"}
              label={createMessage(LOGIN_PAGE_EMAIL_INPUT_LABEL)}
            >
              <FormTextField
                autoFocus
                name={LOGIN_FORM_EMAIL_FIELD_NAME}
                placeholder={createMessage(LOGIN_PAGE_EMAIL_INPUT_PLACEHOLDER)}
                type="email"
              />
            </FormGroup>
            <FormGroup
              intent={error ? "danger" : "none"}
              label={createMessage(LOGIN_PAGE_PASSWORD_INPUT_LABEL)}
            >
              <FormTextField
                name={LOGIN_FORM_PASSWORD_FIELD_NAME}
                placeholder={createMessage(
                  LOGIN_PAGE_PASSWORD_INPUT_PLACEHOLDER,
                )}
                type="password"
              />
            </FormGroup>

            <FormActions>
              <Button
                disabled={!isFormValid}
                fill
                onClick={() => {
                  PerformanceTracker.startTracking(
                    PerformanceTransactionName.LOGIN_CLICK,
                  );
                  AnalyticsUtil.logEvent("LOGIN_CLICK", {
                    loginMethod: "EMAIL",
                  });
                }}
                size={Size.large}
                tag="button"
                text={createMessage(LOGIN_PAGE_LOGIN_BUTTON_TEXT)}
                type="submit"
              />
            </FormActions>
          </SpacedSubmitForm>
          <ForgotPasswordLink>
            <Link to={forgotPasswordURL}>
              {createMessage(LOGIN_PAGE_FORGOT_PASSWORD_TEXT)}
            </Link>
          </ForgotPasswordLink>
        </>
      )}
    </>
  );
}

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
