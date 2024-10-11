import React, { useEffect } from "react";
import type { InjectedFormProps } from "redux-form";
import { reduxForm, formValueSelector } from "redux-form";
import { AUTH_LOGIN_URL } from "constants/routes";
import { SIGNUP_FORM_NAME } from "ee/constants/forms";
import type { RouteComponentProps } from "react-router-dom";
import { useHistory, useLocation, withRouter } from "react-router-dom";
import {
  SpacedSubmitForm,
  FormActions,
  OrWithLines,
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
  GOOGLE_RECAPTCHA_KEY_ERROR,
  LOOKING_TO_SELF_HOST,
  VISIT_OUR_DOCS,
} from "ee/constants/messages";
import FormTextField from "components/utils/ReduxFormTextField";
import ThirdPartyAuth from "pages/UserAuth/ThirdPartyAuth";
import { FormGroup } from "@appsmith/ads-old";
import { Button, Link, Callout } from "@appsmith/ads";
import { isEmail, isStrongPassword, isEmptyString } from "utils/formhelpers";

import type { SignupFormValues } from "pages/UserAuth/helpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

import { SIGNUP_SUBMIT_PATH } from "ee/constants/ApiConstants";
import { connect, useSelector } from "react-redux";
import type { AppState } from "ee/reducers";

import { SIGNUP_FORM_EMAIL_FIELD_NAME } from "ee/constants/forms";
import { getAppsmithConfigs } from "ee/configs";
import { useScript, ScriptStatus, AddScriptTo } from "utils/hooks/useScript";

import { getIsSafeRedirectURL } from "utils/helpers";
import Container from "pages/UserAuth/Container";
import {
  getIsFormLoginEnabled,
  getTenantConfig,
  getThirdPartyAuths,
} from "ee/selectors/tenantSelectors";
import Helmet from "react-helmet";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHTMLPageTitle } from "ee/utils/BusinessFeatures/brandingPageHelpers";
import log from "loglevel";
import { SELF_HOSTING_DOC } from "constants/ThirdPartyConstants";
import * as Sentry from "@sentry/react";
import { Severity } from "@sentry/react";

declare global {
  interface Window {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    grecaptcha: any;
  }
}
const { cloudHosting, googleRecaptchaSiteKey } = getAppsmithConfigs();

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
  RouteComponentProps<{ email: string }> & { emailValue: string };

export function SignUp(props: SignUpFormProps) {
  const history = useHistory();
  const isFormLoginEnabled = useSelector(getIsFormLoginEnabled);

  useEffect(() => {
    if (!isFormLoginEnabled) {
      const search = new URL(window.location.href)?.searchParams?.toString();

      history.replace({
        pathname: AUTH_LOGIN_URL,
        search,
      });
    }

    AnalyticsUtil.logEvent("SIGNUP_REACHED", {
      referrer: document.referrer,
    });
  }, []);
  const { emailValue: email, error, pristine, submitting, valid } = props;
  const isFormValid = valid && email && !isEmptyString(email);
  const socialLoginList = useSelector(getThirdPartyAuths);
  const shouldDisableSignupButton = pristine || !isFormValid;
  const location = useLocation();
  const isBrandingEnabled = useFeatureFlag(
    FEATURE_FLAG.license_branding_enabled,
  );
  const tentantConfig = useSelector(getTenantConfig);
  const { instanceName } = tentantConfig;
  const htmlPageTitle = getHTMLPageTitle(isBrandingEnabled, instanceName);

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
    Sentry.captureException("Sign up failed", {
      level: Severity.Error,
      extra: {
        error: new Error(errorMessage),
      },
    });
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
      try {
        window.grecaptcha
          .execute(googleRecaptchaSiteKey.apiKey, {
            action: "submit",
          }) // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then(function (token: any) {
            if (formElement) {
              signupURL.searchParams.append("recaptchaToken", token);
              formElement.setAttribute("action", signupURL.toString());
              formElement.submit();
            }
          })
          .catch(() => {
            log.error(createMessage(GOOGLE_RECAPTCHA_KEY_ERROR));
          });
      } catch (e) {
        log.error(e);
      }
    } else {
      formElement && formElement.submit();
    }
  };

  const footerSection = (
    <>
      <div className="px-2 flex align-center justify-center text-center text-[color:var(--ads-v2\-color-fg)] text-[14px]">
        {createMessage(ALREADY_HAVE_AN_ACCOUNT)}&nbsp;
        <Link
          className="t--sign-up t--signup-link"
          kind="primary"
          target="_self"
          to={AUTH_LOGIN_URL}
        >
          {createMessage(SIGNUP_PAGE_LOGIN_LINK_TEXT)}
        </Link>
      </div>
      {cloudHosting && (
        <>
          <OrWithLines>or</OrWithLines>
          <div className="px-2 text-center text-[color:var(--ads-v2\-color-fg)] text-[14px]">
            {createMessage(LOOKING_TO_SELF_HOST)}
            <Link
              className="t--visit-docs t--visit-docs-link pl-[var(--ads-v2\-spaces-3)] justify-center"
              kind="primary"
              onClick={() => AnalyticsUtil.logEvent("VISIT_SELF_HOST_DOCS")}
              target="_self"
              to={`${SELF_HOSTING_DOC}?utm_source=cloudSignup`}
            >
              {createMessage(VISIT_OUR_DOCS)}
            </Link>
          </div>
        </>
      )}
    </>
  );

  return (
    <Container footer={footerSection} title={createMessage(SIGNUP_PAGE_TITLE)}>
      <Helmet>
        <title>{htmlPageTitle}</title>
      </Helmet>

      {showError && <Callout kind="error">{errorMessage}</Callout>}
      {socialLoginList.length > 0 && (
        <ThirdPartyAuth logins={socialLoginList} type={"SIGNUP"} />
      )}
      {isFormLoginEnabled && (
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
              isDisabled={shouldDisableSignupButton}
              isLoading={submitting}
              kind="primary"
              onClick={() => {
                AnalyticsUtil.logEvent("SIGNUP_CLICK", {
                  signupMethod: "EMAIL",
                });
              }}
              size="md"
              type="submit"
            >
              {createMessage(SIGNUP_PAGE_SUBMIT_BUTTON_TEXT)}
            </Button>
          </FormActions>
        </SpacedSubmitForm>
      )}
    </Container>
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
  })(withRouter(SignUp)),
);
