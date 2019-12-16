import React, { useLayoutEffect } from "react";
import { AppState } from "reducers";
import { Link, withRouter, RouteComponentProps } from "react-router-dom";
import { connect } from "react-redux";
import { InjectedFormProps, reduxForm, Field } from "redux-form";
import { RESET_PASSWORD_FORM_NAME } from "constants/forms";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getIsTokenValid, getIsValidatingToken } from "selectors/authSelectors";
import { Icon } from "@blueprintjs/core";
import TextField from "components/editorComponents/form/fields/TextField";
import MessageTag, {
  MessageTagProps,
  MessageAction,
} from "components/editorComponents/form/MessageTag";
import Spinner from "components/editorComponents/Spinner";
import FormButton from "components/editorComponents/FormButton";
import FormGroup from "components/editorComponents/FormGroup";
import StyledForm from "components/editorComponents/Form";
import { isEmptyString, isStrongPassword } from "utils/formhelpers";

import { ResetPasswordFormValues, resetPasswordSubmitHandler } from "./helpers";
import {
  AuthCardHeader,
  AuthCardFooter,
  AuthCardContainer,
  AuthCardBody,
  AuthCardNavLink,
  FormActions,
} from "./StyledComponents";
import { AUTH_LOGIN_URL, FORGOT_PASSWORD_URL } from "constants/routes";

import {
  RESET_PASSWORD_PAGE_PASSWORD_INPUT_LABEL,
  RESET_PASSWORD_PAGE_PASSWORD_INPUT_PLACEHOLDER,
  RESET_PASSWORD_LOGIN_LINK_TEXT,
  RESET_PASSWORD_SUBMIT_BUTTON_TEXT,
  RESET_PASSWORD_PAGE_SUBTITLE,
  RESET_PASSWORD_PAGE_TITLE,
  FORM_VALIDATION_INVALID_PASSWORD,
  FORM_VALIDATION_EMPTY_PASSWORD,
  RESET_PASSWORD_EXPIRED_TOKEN,
  RESET_PASSWORD_FORGOT_PASSWORD_LINK,
  RESET_PASSWORD_INVALID_TOKEN,
  RESET_PASSWORD_RESET_SUCCESS,
  RESET_PASSWORD_RESET_SUCCESS_LOGIN_LINK,
  PRIVACY_POLICY_LINK,
  TERMS_AND_CONDITIONS_LINK,
} from "constants/messages";

const validate = (values: ResetPasswordFormValues) => {
  const errors: ResetPasswordFormValues = {};
  if (!values.password || isEmptyString(values.password)) {
    errors.password = FORM_VALIDATION_EMPTY_PASSWORD;
  } else if (!isStrongPassword(values.password)) {
    errors.password = FORM_VALIDATION_INVALID_PASSWORD;
  }
  return errors;
};

type ResetPasswordProps = InjectedFormProps<
  ResetPasswordFormValues,
  {
    verifyToken: (token: string, email: string) => void;
    isTokenValid: boolean;
    validatingToken: boolean;
  }
> & {
  verifyToken: (token: string, email: string) => void;
  isTokenValid: boolean;
  validatingToken: boolean;
} & RouteComponentProps<{ email: string; token: string }>;

export const ResetPassword = (props: ResetPasswordProps) => {
  const {
    error,
    handleSubmit,
    pristine,
    submitting,
    submitSucceeded,
    submitFailed,
    initialValues,
    isTokenValid,
    validatingToken,
    verifyToken,
  } = props;

  useLayoutEffect(() => {
    if (initialValues.token && initialValues.email)
      verifyToken(initialValues.token, initialValues.email);
  }, [initialValues.token, initialValues.email, verifyToken]);

  const showInvalidMessage = !initialValues.token || !initialValues.email;
  const showExpiredMessage = !isTokenValid && !validatingToken;
  const showSuccessMessage = submitSucceeded && !pristine;
  const showFailureMessage = submitFailed && !!error;

  let message = "";
  let messageActions: MessageAction[] | undefined = undefined;
  if (showExpiredMessage || showInvalidMessage) {
    messageActions = [
      {
        url: FORGOT_PASSWORD_URL,
        text: RESET_PASSWORD_FORGOT_PASSWORD_LINK,
        intent: "success",
      },
    ];
  }
  if (showExpiredMessage) {
    message = RESET_PASSWORD_EXPIRED_TOKEN;
  }
  if (showInvalidMessage) {
    message = RESET_PASSWORD_INVALID_TOKEN;
  }

  if (showSuccessMessage) {
    message = RESET_PASSWORD_RESET_SUCCESS;
    messageActions = [
      {
        url: AUTH_LOGIN_URL,
        text: RESET_PASSWORD_RESET_SUCCESS_LOGIN_LINK,
        intent: "success",
      },
    ];
  }
  if (showFailureMessage) {
    message = error;
  }

  const messageTagProps: MessageTagProps = {
    intent:
      showInvalidMessage || showExpiredMessage || showFailureMessage
        ? "danger"
        : "success",
    message,
    actions: messageActions,
  };

  if (showInvalidMessage || showExpiredMessage) {
    return <MessageTag {...messageTagProps} />;
  }

  if (!isTokenValid && validatingToken) {
    return <Spinner />;
  }
  return (
    <AuthCardContainer>
      {(showSuccessMessage || showFailureMessage) && (
        <MessageTag {...messageTagProps} />
      )}
      <AuthCardHeader>
        <h1>{RESET_PASSWORD_PAGE_TITLE}</h1>
        <h5>{RESET_PASSWORD_PAGE_SUBTITLE}</h5>
      </AuthCardHeader>
      <AuthCardBody>
        <StyledForm onSubmit={handleSubmit(resetPasswordSubmitHandler)}>
          <FormGroup
            intent={error ? "danger" : "none"}
            label={RESET_PASSWORD_PAGE_PASSWORD_INPUT_LABEL}
          >
            <TextField
              name="password"
              type="password"
              placeholder={RESET_PASSWORD_PAGE_PASSWORD_INPUT_PLACEHOLDER}
              showError
            />
          </FormGroup>
          <Field type="hidden" name="email" component="input" />
          <Field type="hidden" name="token" component="input" />
          <FormActions>
            <FormButton
              type="submit"
              text={RESET_PASSWORD_SUBMIT_BUTTON_TEXT}
              intent="primary"
              disabled={pristine}
              loading={submitting}
            />
          </FormActions>
        </StyledForm>
      </AuthCardBody>
      <AuthCardNavLink to={AUTH_LOGIN_URL}>
        {RESET_PASSWORD_LOGIN_LINK_TEXT}
        <Icon icon="arrow-right" intent="primary" />
      </AuthCardNavLink>
      <AuthCardFooter>
        <Link to="#">{PRIVACY_POLICY_LINK}</Link>
        <Link to="#">{TERMS_AND_CONDITIONS_LINK}</Link>
      </AuthCardFooter>
    </AuthCardContainer>
  );
};

export default connect(
  (state: AppState, props: ResetPasswordProps) => {
    const queryParams = new URLSearchParams(props.location.search);
    return {
      initialValues: {
        email: queryParams.get("email") || undefined,
        token: queryParams.get("token") || undefined,
      },
      isTokenValid: getIsTokenValid(state),
      validatingToken: getIsValidatingToken(state),
    };
  },
  (dispatch: any) => ({
    verifyToken: (token: string, email: string) =>
      dispatch({
        type: ReduxActionTypes.RESET_PASSWORD_VERIFY_TOKEN_INIT,
        payload: { token, email },
      }),
  }),
)(
  reduxForm<
    ResetPasswordFormValues,
    {
      verifyToken: (token: string, email: string) => void;
      validatingToken: boolean;
      isTokenValid: boolean;
    }
  >({
    validate,
    form: RESET_PASSWORD_FORM_NAME,
    touchOnBlur: true,
  })(withRouter(ResetPassword)),
);
