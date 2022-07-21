import React, { useEffect } from "react";
import { reduxForm, InjectedFormProps, formValueSelector } from "redux-form";
import { AUTH_LOGIN_URL } from "constants/routes";
import { SIGNUP_FORM_NAME } from "constants/forms";
import {
  RouteComponentProps,
  useHistory,
  useLocation,
  withRouter,
} from "react-router-dom";
import {
  AuthCardHeader,
  AuthCardNavLink,
  SpacedSubmitForm,
  FormActions,
  SignUpLinkSection,
} from "pages/UserAuth/StyledComponents";
import {
  SIGNUP_PAGE_TITLE,
  SIGNUP_PAGE_EMAIL_INPUT_LABEL,
  SIGNUP_PAGE_EMAIL_INPUT_PLACEHOLDER,
  SIGNUP_PAGE_PASSWORD_INPUT_LABEL,
  SIGNUP_PAGE_PASSWORD_INPUT_PLACEHOLDER,
  SIGNUP_PAGE_LOGIN_LINK_TEXT,
  FORM_VALIDATION_EMPTY_PASSWORD,
  FORM_VALIDATION_INVALID_EMAIL,
  FORM_VALIDATION_INVALID_PASSWORD,
  SIGNUP_PAGE_SUBMIT_BUTTON_TEXT,
  ALREADY_HAVE_AN_ACCOUNT,
  createMessage,
} from "@appsmith/constants/messages";
import FormMessage from "components/ads/formFields/FormMessage";
import FormGroup from "components/ads/formFields/FormGroup";
import FormTextField from "components/ads/formFields/TextField";
import ThirdPartyAuth from "@appsmith/pages/UserAuth/ThirdPartyAuth";
import { ThirdPartyLoginRegistry } from "pages/UserAuth/ThirdPartyLoginRegistry";
import Button, { Size } from "components/ads/Button";

import { isEmail, isStrongPassword, isEmptyString } from "utils/formhelpers";

import { SignupFormValues } from "pages/UserAuth/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";

import { SIGNUP_SUBMIT_PATH } from "@appsmith/constants/ApiConstants";
import { connect } from "react-redux";
import { AppState } from "reducers";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

import { SIGNUP_FORM_EMAIL_FIELD_NAME } from "constants/forms";
import { getAppsmithConfigs } from "@appsmith/configs";
import { useScript, ScriptStatus, AddScriptTo } from "utils/hooks/useScript";

import { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import { getIsSafeRedirectURL } from "utils/helpers";

declare global {
  interface Window {
    grecaptcha: any;
  }
}
const { disableLoginForm, googleRecaptchaSiteKey } = getAppsmithConfigs();

const validate = (values: SignupFormValues) => {
  const errors: SignupFormValues = {};
  if (!values.password || isEmptyString(values.password)) {
    errors.password = createMessage(FORM_VALIDATION_EMPTY_PASSWORD);
  } else if (!isStrongPassword(values.password)) {
    errors.password = createMessage(FORM_VALIDATION_INVALID_PASSWORD);
  }

  const email = values.email || "";
  if (!isEmptyString(email) && !isEmail(email)) {
    errors.email = createMessage(FORM_VALIDATION_INVALID_EMAIL);
  }
  return errors;
};

type SignUpFormProps = InjectedFormProps<
  SignupFormValues,
  { emailValue: string }
> &
  RouteComponentProps<{ email: string }> & { theme: Theme; emailValue: string };

export function SignUp(props: SignUpFormProps) {
  const history = useHistory();
  useEffect(() => {
    if (disableLoginForm) {
      const search = new URL(window.location.href)?.searchParams?.toString();
      history.replace({
        pathname: AUTH_LOGIN_URL,
        search,
      });
    }
  }, []);
  const { emailValue: email, error, pristine, submitting, valid } = props;
  const isFormValid = valid && email && !isEmptyString(email);
  const socialLoginList = ThirdPartyLoginRegistry.get();
  const shouldDisableSignupButton = pristine || !isFormValid;
  const location = useLocation();

  const recaptchaStatus = useScript(
    `https://www.google.com/recaptcha/api.js?render=${googleRecaptchaSiteKey.apiKey}`,
    AddScriptTo.HEAD,
  );

  let showError = false;
  let errorMessage = "";
  const queryParams = new URLSearchParams(location.search);
  if (queryParams.get("error")) {
    errorMessage = queryParams.get("error") || "";
    showError = true;
  }

  const signupURL = new URL(
    `/api/v1/` + SIGNUP_SUBMIT_PATH,
    window.location.origin,
  );
  const appId = queryParams.get("appId");
  if (appId) {
    signupURL.searchParams.append("appId", appId);
  } else {
    const redirectUrl = queryParams.get("redirectUrl");
    if (redirectUrl != null && getIsSafeRedirectURL(redirectUrl)) {
      signupURL.searchParams.append("redirectUrl", redirectUrl);
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement: HTMLFormElement = document.getElementById(
      "signup-form",
    ) as HTMLFormElement;
    if (
      googleRecaptchaSiteKey.enabled &&
      recaptchaStatus === ScriptStatus.READY
    ) {
      window.grecaptcha
        .execute(googleRecaptchaSiteKey.apiKey, {
          action: "submit",
        })
        .then(function(token: any) {
          if (formElement) {
            signupURL.searchParams.append("recaptchaToken", token);
            formElement.setAttribute("action", signupURL.toString());
            formElement.submit();
          }
        });
    } else {
      formElement && formElement.submit();
    }
  };

  return (
    <>
      {showError && <FormMessage intent="danger" message={errorMessage} />}
      <AuthCardHeader>
        <h1>{createMessage(SIGNUP_PAGE_TITLE)}</h1>
      </AuthCardHeader>
      <SignUpLinkSection>
        {createMessage(ALREADY_HAVE_AN_ACCOUNT)}
        <AuthCardNavLink
          style={{ marginLeft: props.theme.spaces[3] }}
          to={AUTH_LOGIN_URL}
        >
          {createMessage(SIGNUP_PAGE_LOGIN_LINK_TEXT)}
        </AuthCardNavLink>
      </SignUpLinkSection>
      {socialLoginList.length > 0 && (
        <ThirdPartyAuth logins={socialLoginList} type={"SIGNUP"} />
      )}
      {!disableLoginForm && (
        <SpacedSubmitForm
          action={signupURL.toString()}
          id="signup-form"
          method="POST"
          onSubmit={(e) => handleSubmit(e)}
        >
          <FormGroup
            intent={error ? "danger" : "none"}
            label={createMessage(SIGNUP_PAGE_EMAIL_INPUT_LABEL)}
          >
            <FormTextField
              autoFocus
              name="email"
              placeholder={createMessage(SIGNUP_PAGE_EMAIL_INPUT_PLACEHOLDER)}
              type="email"
            />
          </FormGroup>
          <FormGroup
            intent={error ? "danger" : "none"}
            label={createMessage(SIGNUP_PAGE_PASSWORD_INPUT_LABEL)}
          >
            <FormTextField
              name="password"
              placeholder={createMessage(
                SIGNUP_PAGE_PASSWORD_INPUT_PLACEHOLDER,
              )}
              type="password"
            />
          </FormGroup>
          <FormActions>
            <Button
              disabled={shouldDisableSignupButton}
              fill
              isLoading={submitting}
              onClick={() => {
                AnalyticsUtil.logEvent("SIGNUP_CLICK", {
                  signupMethod: "EMAIL",
                });
                PerformanceTracker.startTracking(
                  PerformanceTransactionName.SIGN_UP,
                );
              }}
              size={Size.large}
              tag="button"
              text={createMessage(SIGNUP_PAGE_SUBMIT_BUTTON_TEXT)}
              type="submit"
            />
          </FormActions>
        </SpacedSubmitForm>
      )}
    </>
  );
}

const selector = formValueSelector(SIGNUP_FORM_NAME);
export default connect((state: AppState, props: SignUpFormProps) => {
  const queryParams = new URLSearchParams(props.location.search);
  return {
    initialValues: {
      email: queryParams.get("email"),
    },
    emailValue: selector(state, SIGNUP_FORM_EMAIL_FIELD_NAME),
  };
}, null)(
  reduxForm<SignupFormValues, { emailValue: string }>({
    validate,
    form: SIGNUP_FORM_NAME,
    touchOnBlur: true,
  })(withRouter(withTheme(SignUp))),
);
