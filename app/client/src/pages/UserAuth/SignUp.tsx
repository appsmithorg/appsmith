import React from "react";
import { reduxForm, InjectedFormProps } from "redux-form";
import { AUTH_LOGIN_URL } from "constants/routes";
import { SIGNUP_FORM_NAME } from "constants/forms";
import { RouteComponentProps, useLocation, withRouter } from "react-router-dom";
import {
  AuthCardHeader,
  AuthCardNavLink,
  SpacedSubmitForm,
  FormActions,
  SignUpLinkSection,
} from "./StyledComponents";
import {
  SIGNUP_PAGE_TITLE,
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
  ALREADY_HAVE_AN_ACCOUNT,
} from "constants/messages";
import FormMessage from "components/ads/formFields/FormMessage";
import FormGroup from "components/ads/formFields/FormGroup";
import FormTextField from "components/ads/formFields/TextField";
import ThirdPartyAuth, { SocialLoginTypes } from "./ThirdPartyAuth";
import Button, { Size } from "components/ads/Button";

import { isEmail, isStrongPassword, isEmptyString } from "utils/formhelpers";

import { SignupFormValues } from "./helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";

import { getAppsmithConfigs } from "configs";
import { SIGNUP_SUBMIT_PATH } from "constants/ApiConstants";
import { connect } from "react-redux";
import { AppState } from "reducers";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { setOnboardingState } from "utils/storage";
const { enableGithubOAuth, enableGoogleOAuth } = getAppsmithConfigs();
const SocialLoginList: string[] = [];
if (enableGithubOAuth) SocialLoginList.push(SocialLoginTypes.GITHUB);
if (enableGoogleOAuth) SocialLoginList.push(SocialLoginTypes.GOOGLE);

import { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";

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

type SignUpFormProps = InjectedFormProps<SignupFormValues> &
  RouteComponentProps<{ email: string }> & { theme: Theme };

export const SignUp = (props: SignUpFormProps) => {
  const { error, submitting, pristine, valid } = props;
  const location = useLocation();

  let showError = false;
  let errorMessage = "";
  const queryParams = new URLSearchParams(location.search);
  if (queryParams.get("error")) {
    errorMessage = queryParams.get("error") || "";
    showError = true;
  }

  let signupURL = "/api/v1/" + SIGNUP_SUBMIT_PATH;
  if (queryParams.has("appId")) {
    signupURL += `?appId=${queryParams.get("appId")}`;
  } else if (queryParams.has("redirectUrl")) {
    signupURL += `?redirectUrl=${queryParams.get("redirectUrl")}`;
  }

  return (
    <>
      {showError && <FormMessage intent="danger" message={errorMessage} />}
      <AuthCardHeader>
        <h1>{SIGNUP_PAGE_TITLE}</h1>
      </AuthCardHeader>
      <SignUpLinkSection>
        {ALREADY_HAVE_AN_ACCOUNT}
        <AuthCardNavLink
          to={AUTH_LOGIN_URL}
          style={{ marginLeft: props.theme.spaces[3] }}
        >
          {SIGNUP_PAGE_LOGIN_LINK_TEXT}
        </AuthCardNavLink>
      </SignUpLinkSection>
      {SocialLoginList.length > 0 && (
        <ThirdPartyAuth type={"SIGNUP"} logins={SocialLoginList} />
      )}
      <SpacedSubmitForm method="POST" action={signupURL}>
        <FormGroup
          intent={error ? "danger" : "none"}
          label={SIGNUP_PAGE_EMAIL_INPUT_LABEL}
        >
          <FormTextField
            name="email"
            type="email"
            placeholder={SIGNUP_PAGE_EMAIL_INPUT_PLACEHOLDER}
            autoFocus
          />
        </FormGroup>
        <FormGroup
          intent={error ? "danger" : "none"}
          label={SIGNUP_PAGE_PASSWORD_INPUT_LABEL}
          // helperText={FORM_VALIDATION_PASSWORD_RULE}
        >
          <FormTextField
            type="password"
            name="password"
            placeholder={SIGNUP_PAGE_PASSWORD_INPUT_PLACEHOLDER}
          />
        </FormGroup>
        <FormActions>
          <Button
            tag="button"
            type="submit"
            disabled={pristine || !valid}
            isLoading={submitting}
            text={SIGNUP_PAGE_SUBMIT_BUTTON_TEXT}
            fill
            size={Size.large}
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNUP_CLICK", {
                signupMethod: "EMAIL",
              });
              PerformanceTracker.startTracking(
                PerformanceTransactionName.SIGN_UP,
              );
              setOnboardingState(true);
            }}
          />
        </FormActions>
      </SpacedSubmitForm>
    </>
  );
};

export default connect((state: AppState, props: SignUpFormProps) => {
  const queryParams = new URLSearchParams(props.location.search);
  return {
    initialValues: {
      email: queryParams.get("email"),
    },
  };
}, null)(
  reduxForm<SignupFormValues>({
    validate,
    form: SIGNUP_FORM_NAME,
    touchOnBlur: true,
  })(withRouter(withTheme(SignUp))),
);
