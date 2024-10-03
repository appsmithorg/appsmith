import React from "react";
import { Redirect, useLocation } from "react-router-dom";
import { connect, useSelector } from "react-redux";
import type { InjectedFormProps, DecoratedFormProps } from "redux-form";
import { reduxForm, formValueSelector, isDirty } from "redux-form";
import {
  LOGIN_FORM_NAME,
  LOGIN_FORM_EMAIL_FIELD_NAME,
  LOGIN_FORM_PASSWORD_FIELD_NAME,
} from "ee/constants/forms";
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
} from "ee/constants/messages";
import { FormGroup } from "@appsmith/ads-old";
import { Button, Link, Callout } from "@appsmith/ads";
import FormTextField from "components/utils/ReduxFormTextField";
import ThirdPartyAuth from "pages/UserAuth/ThirdPartyAuth";
import { isEmail, isEmptyString } from "utils/formhelpers";
import type { LoginFormValues } from "pages/UserAuth/helpers";

import {
  SpacedSubmitForm,
  FormActions,
  EmailFormWrapper,
} from "pages/UserAuth/StyledComponents";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { LOGIN_SUBMIT_PATH } from "ee/constants/ApiConstants";
import { getIsSafeRedirectURL } from "utils/helpers";
import { getCurrentUser } from "selectors/usersSelectors";
import Container from "pages/UserAuth/Container";
import {
  getThirdPartyAuths,
  getIsFormLoginEnabled,
  getTenantConfig,
} from "ee/selectors/tenantSelectors";
import Helmet from "react-helmet";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHTMLPageTitle } from "ee/utils/BusinessFeatures/brandingPageHelpers";
import * as Sentry from "@sentry/react";
import { Severity } from "@sentry/react";
const validate = (values: LoginFormValues, props: ValidateProps) => {
  const errors: LoginFormValues = {};
  const email = values[LOGIN_FORM_EMAIL_FIELD_NAME] || "";
  const password = values[LOGIN_FORM_PASSWORD_FIELD_NAME];
  const { isPasswordFieldDirty, touch } = props;

  if (!password || isEmptyString(password)) {
    isPasswordFieldDirty && touch?.(LOGIN_FORM_PASSWORD_FIELD_NAME);
    errors[LOGIN_FORM_PASSWORD_FIELD_NAME] = createMessage(
      FORM_VALIDATION_EMPTY_PASSWORD,
    );
  }

  if (!isEmptyString(email) && !isEmail(email)) {
    touch?.(LOGIN_FORM_EMAIL_FIELD_NAME);
    errors[LOGIN_FORM_EMAIL_FIELD_NAME] = createMessage(
      FORM_VALIDATION_INVALID_EMAIL,
    );
  }

  return errors;
};

type LoginFormProps = {
  emailValue: string;
} & InjectedFormProps<LoginFormValues, { emailValue: string }>;

type ValidateProps = {
  isPasswordFieldDirty?: boolean;
} & DecoratedFormProps<
  LoginFormValues,
  { emailValue: string; isPasswordFieldDirty?: boolean }
>;

export function Login(props: LoginFormProps) {
  const { emailValue: email, error, valid } = props;
  const isFormValid = valid && email && !isEmptyString(email);
  const location = useLocation();
  const isFormLoginEnabled = useSelector(getIsFormLoginEnabled);
  const socialLoginList = useSelector(getThirdPartyAuths);
  const queryParams = new URLSearchParams(location.search);
  const isBrandingEnabled = useFeatureFlag(
    FEATURE_FLAG.license_branding_enabled,
  );
  const tentantConfig = useSelector(getTenantConfig);
  const { instanceName } = tentantConfig;
  const htmlPageTitle = getHTMLPageTitle(isBrandingEnabled, instanceName);
  const invalidCredsForgotPasswordLinkText = createMessage(
    LOGIN_PAGE_INVALID_CREDS_FORGOT_PASSWORD_LINK,
  );
  let showError = false;
  let errorMessage = "";
  const currentUser = useSelector(getCurrentUser);

  if (currentUser?.emptyInstance) {
    return <Redirect to={SETUP} />;
  }

  if (queryParams.get("error")) {
    errorMessage = queryParams.get("message") || queryParams.get("error") || "";
    showError = true;
    Sentry.captureException("Sign up failed", {
      level: Severity.Error,
      extra: {
        error: new Error(errorMessage),
      },
    });
  }

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

  const footerSection = isFormLoginEnabled && (
    <div className="px-2 flex align-center justify-center text-center text-[color:var(--ads-v2\-color-fg)] text-[14px]">
      {createMessage(NEW_TO_APPSMITH)}&nbsp;
      <Link
        className="t--sign-up t--signup-link"
        kind="primary"
        target="_self"
        to={signupURL}
      >
        {createMessage(LOGIN_PAGE_SIGN_UP_LINK_TEXT)}
      </Link>
    </div>
  );

  return (
    <Container footer={footerSection} title={createMessage(LOGIN_PAGE_TITLE)}>
      <Helmet>
        <title>{htmlPageTitle}</title>
      </Helmet>

      {showError && (
        <Callout
          kind="error"
          links={
            !!errorMessage
              ? undefined
              : [
                  {
                    children: invalidCredsForgotPasswordLinkText,
                    to: FORGOT_PASSWORD_URL,
                  },
                ]
          }
        >
          {!!errorMessage && errorMessage !== "true"
            ? errorMessage
            : createMessage(LOGIN_PAGE_INVALID_CREDS_ERROR)}
        </Callout>
      )}
      {socialLoginList.length > 0 && (
        <ThirdPartyAuth logins={socialLoginList} type={"SIGNIN"} />
      )}
      {isFormLoginEnabled && (
        <EmailFormWrapper>
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
                isDisabled={!isFormValid}
                kind="primary"
                onClick={() => {
                  AnalyticsUtil.logEvent("LOGIN_CLICK", {
                    loginMethod: "EMAIL",
                  });
                }}
                size="md"
                type="submit"
              >
                {createMessage(LOGIN_PAGE_LOGIN_BUTTON_TEXT)}
              </Button>
            </FormActions>
          </SpacedSubmitForm>
          <Link
            className="justify-center"
            kind="secondary"
            target="_self"
            to={forgotPasswordURL}
          >
            {createMessage(LOGIN_PAGE_FORGOT_PASSWORD_TEXT)}
          </Link>
        </EmailFormWrapper>
      )}
    </Container>
  );
}

const selector = formValueSelector(LOGIN_FORM_NAME);

export default connect((state) => ({
  emailValue: selector(state, LOGIN_FORM_EMAIL_FIELD_NAME),
  isPasswordFieldDirty: isDirty(LOGIN_FORM_NAME)(
    state,
    LOGIN_FORM_PASSWORD_FIELD_NAME,
  ),
}))(
  reduxForm<LoginFormValues, { emailValue: string }>({
    validate,
    touchOnBlur: false,
    form: LOGIN_FORM_NAME,
  })(Login),
);
