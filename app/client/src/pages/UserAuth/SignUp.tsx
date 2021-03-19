import React from "react";
import { reduxForm, InjectedFormProps, formValueSelector } from "redux-form";
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
  FORM_VALIDATION_EMPTY_PASSWORD,
  FORM_VALIDATION_INVALID_EMAIL,
  FORM_VALIDATION_INVALID_PASSWORD,
  SIGNUP_PAGE_SUBMIT_BUTTON_TEXT,
  ALREADY_HAVE_AN_ACCOUNT,
  createMessage,
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
import { useIntiateOnboarding } from "components/editorComponents/Onboarding/utils";

import { SIGNUP_FORM_EMAIL_FIELD_NAME } from "constants/forms";

const { enableGithubOAuth, enableGoogleOAuth } = getAppsmithConfigs();
const SocialLoginList: string[] = [];
if (enableGoogleOAuth) SocialLoginList.push(SocialLoginTypes.GOOGLE);
if (enableGithubOAuth) SocialLoginList.push(SocialLoginTypes.GITHUB);

import { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";

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

export const SignUp = (props: SignUpFormProps) => {
  const { error, submitting, pristine, valid, emailValue: email } = props;
  const isFormValid = valid && email && !isEmptyString(email);

  const location = useLocation();
  const initiateOnboarding = useIntiateOnboarding();

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
        <h1>{createMessage(SIGNUP_PAGE_TITLE)}</h1>
      </AuthCardHeader>
      <SignUpLinkSection>
        {createMessage(ALREADY_HAVE_AN_ACCOUNT)}
        <AuthCardNavLink
          to={AUTH_LOGIN_URL}
          style={{ marginLeft: props.theme.spaces[3] }}
        >
          {createMessage(SIGNUP_PAGE_LOGIN_LINK_TEXT)}
        </AuthCardNavLink>
      </SignUpLinkSection>
      {SocialLoginList.length > 0 && (
        <ThirdPartyAuth type={"SIGNUP"} logins={SocialLoginList} />
      )}
      <SpacedSubmitForm method="POST" action={signupURL}>
        <FormGroup
          intent={error ? "danger" : "none"}
          label={createMessage(SIGNUP_PAGE_EMAIL_INPUT_LABEL)}
        >
          <FormTextField
            name="email"
            type="email"
            placeholder={createMessage(SIGNUP_PAGE_EMAIL_INPUT_PLACEHOLDER)}
            autoFocus
          />
        </FormGroup>
        <FormGroup
          intent={error ? "danger" : "none"}
          label={createMessage(SIGNUP_PAGE_PASSWORD_INPUT_LABEL)}
        >
          <FormTextField
            type="password"
            name="password"
            placeholder={createMessage(SIGNUP_PAGE_PASSWORD_INPUT_PLACEHOLDER)}
          />
        </FormGroup>
        <FormActions>
          <Button
            tag="button"
            type="submit"
            disabled={pristine || !isFormValid}
            isLoading={submitting}
            text={createMessage(SIGNUP_PAGE_SUBMIT_BUTTON_TEXT)}
            fill
            size={Size.large}
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNUP_CLICK", {
                signupMethod: "EMAIL",
              });
              PerformanceTracker.startTracking(
                PerformanceTransactionName.SIGN_UP,
              );
              initiateOnboarding();
            }}
          />
        </FormActions>
      </SpacedSubmitForm>
    </>
  );
};

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
