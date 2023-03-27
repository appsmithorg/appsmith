import React from "react";
import { Link, Redirect, useLocation } from "react-router-dom";
import { connect, useSelector } from "react-redux";
import type { InjectedFormProps, DecoratedFormProps } from "redux-form";
import { reduxForm, formValueSelector, isDirty } from "redux-form";
import {
  LOGIN_FORM_NAME,
  LOGIN_FORM_EMAIL_FIELD_NAME,
  LOGIN_FORM_PASSWORD_FIELD_NAME,
} from "@appsmith/constants/forms";
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
  LOGIN_PAGE_SUBTITLE,
} from "@appsmith/constants/messages";
import { Button, FormGroup, FormMessage, Size } from "design-system-old";
import FormTextField from "components/utils/ReduxFormTextField";
import ThirdPartyAuth from "@appsmith/pages/UserAuth/ThirdPartyAuth";
import { ThirdPartyLoginRegistry } from "pages/UserAuth/ThirdPartyLoginRegistry";
import { isEmail, isEmptyString } from "utils/formhelpers";
import type { LoginFormValues } from "pages/UserAuth/helpers";

import {
  SpacedSubmitForm,
  FormActions,
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
import Container from "pages/UserAuth/Container";
const { disableLoginForm } = getAppsmithConfigs();

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
  const socialLoginList = ThirdPartyLoginRegistry.get();
  const queryParams = new URLSearchParams(location.search);
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

  const footerSection = !disableLoginForm && (
    <div className="px-2 py-4 text-base text-center border-b">
      {createMessage(NEW_TO_APPSMITH)}
      <Link
        className="t--sign-up  ml-2 text-[color:var(--ads-color-brand)] hover:text-[color:var(--ads-color-brand)] t--signup-link"
        to={signupURL}
      >
        {createMessage(LOGIN_PAGE_SIGN_UP_LINK_TEXT)}
      </Link>
    </div>
  );

  return (
    <Container
      footer={footerSection}
      subtitle={createMessage(LOGIN_PAGE_SUBTITLE)}
      title={createMessage(LOGIN_PAGE_TITLE)}
    >
      {showError && (
        <FormMessage
          actions={
            !!errorMessage
              ? []
              : [
                  {
                    linkElement: (
                      <Link to={FORGOT_PASSWORD_URL}>
                        {invalidCredsForgotPasswordLinkText}
                      </Link>
                    ),
                    text: invalidCredsForgotPasswordLinkText,
                    intent: "success",
                  },
                ]
          }
          intent="danger"
          linkAs={Link}
          message={
            !!errorMessage && errorMessage !== "true"
              ? errorMessage
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
