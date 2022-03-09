import React, { useLayoutEffect } from "react";
import { AppState } from "reducers";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { connect } from "react-redux";
import { InjectedFormProps, reduxForm, Field } from "redux-form";
import { RESET_PASSWORD_FORM_NAME } from "constants/forms";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getIsTokenValid, getIsValidatingToken } from "selectors/authSelectors";
import { Icon } from "@blueprintjs/core";
import FormGroup from "components/ads/formFields/FormGroup";
import FormTextField from "components/ads/formFields/TextField";
import FormMessage, {
  MessageAction,
  FormMessageProps,
} from "components/ads/formFields/FormMessage";
import Spinner from "components/editorComponents/Spinner";
import Button, { Size } from "components/ads/Button";

import StyledForm from "components/editorComponents/Form";
import { isEmptyString, isStrongPassword } from "utils/formhelpers";
import { ResetPasswordFormValues, resetPasswordSubmitHandler } from "./helpers";
import {
  AuthCardHeader,
  BlackAuthCardNavLink,
  FormActions,
} from "./StyledComponents";
import { AUTH_LOGIN_URL, FORGOT_PASSWORD_URL } from "constants/routes";
import { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";

import {
  RESET_PASSWORD_PAGE_PASSWORD_INPUT_LABEL,
  RESET_PASSWORD_PAGE_PASSWORD_INPUT_PLACEHOLDER,
  RESET_PASSWORD_LOGIN_LINK_TEXT,
  RESET_PASSWORD_SUBMIT_BUTTON_TEXT,
  RESET_PASSWORD_PAGE_TITLE,
  FORM_VALIDATION_INVALID_PASSWORD,
  FORM_VALIDATION_EMPTY_PASSWORD,
  RESET_PASSWORD_EXPIRED_TOKEN,
  RESET_PASSWORD_FORGOT_PASSWORD_LINK,
  RESET_PASSWORD_INVALID_TOKEN,
  RESET_PASSWORD_RESET_SUCCESS,
  RESET_PASSWORD_RESET_SUCCESS_LOGIN_LINK,
  createMessage,
} from "@appsmith/constants/messages";

const validate = (values: ResetPasswordFormValues) => {
  const errors: ResetPasswordFormValues = {};
  if (!values.password || isEmptyString(values.password)) {
    errors.password = createMessage(FORM_VALIDATION_EMPTY_PASSWORD);
  } else if (!isStrongPassword(values.password)) {
    errors.password = createMessage(FORM_VALIDATION_INVALID_PASSWORD);
  }
  return errors;
};

type ResetPasswordProps = InjectedFormProps<
  ResetPasswordFormValues,
  {
    verifyToken: (token: string) => void;
    isTokenValid: boolean;
    validatingToken: boolean;
  }
> & {
  verifyToken: (token: string) => void;
  isTokenValid: boolean;
  validatingToken: boolean;
  theme: Theme;
} & RouteComponentProps<{ email: string; token: string }>;

export function ResetPassword(props: ResetPasswordProps) {
  const {
    error,
    handleSubmit,
    initialValues,
    isTokenValid,
    pristine,
    submitFailed,
    submitSucceeded,
    submitting,
    validatingToken,
    verifyToken,
  } = props;

  useLayoutEffect(() => {
    if (initialValues.token) verifyToken(initialValues.token);
  }, [initialValues.token, verifyToken]);

  const showInvalidMessage = !initialValues.token;
  const showExpiredMessage = !isTokenValid && !validatingToken;
  const showSuccessMessage = submitSucceeded && !pristine;
  const showFailureMessage = submitFailed && !!error;

  let message = "";
  let messageActions: MessageAction[] | undefined = undefined;
  if (showExpiredMessage || showInvalidMessage) {
    messageActions = [
      {
        url: FORGOT_PASSWORD_URL,
        text: createMessage(RESET_PASSWORD_FORGOT_PASSWORD_LINK),
        intent: "primary",
      },
    ];
  }
  if (showExpiredMessage) {
    message = createMessage(RESET_PASSWORD_EXPIRED_TOKEN);
  }
  if (showInvalidMessage) {
    message = createMessage(RESET_PASSWORD_INVALID_TOKEN);
  }

  if (showSuccessMessage) {
    message = createMessage(RESET_PASSWORD_RESET_SUCCESS);
    messageActions = [
      {
        url: AUTH_LOGIN_URL,
        text: createMessage(RESET_PASSWORD_RESET_SUCCESS_LOGIN_LINK),
        intent: "success",
      },
    ];
  }
  if (showFailureMessage) {
    message = error;
    if (
      message
        .toLowerCase()
        .includes(
          createMessage(RESET_PASSWORD_FORGOT_PASSWORD_LINK).toLowerCase(),
        )
    ) {
      messageActions = [
        {
          url: FORGOT_PASSWORD_URL,
          text: createMessage(RESET_PASSWORD_FORGOT_PASSWORD_LINK),
          intent: "primary",
        },
      ];
    }
  }

  const messageTagProps: FormMessageProps = {
    intent:
      showInvalidMessage || showExpiredMessage || showFailureMessage
        ? "danger"
        : "lightSuccess",
    message,
    actions: messageActions,
  };

  if (showInvalidMessage || showExpiredMessage) {
    return <FormMessage {...messageTagProps} />;
  }

  if (!isTokenValid && validatingToken) {
    return <Spinner />;
  }
  return (
    <>
      <AuthCardHeader>
        <h1>{createMessage(RESET_PASSWORD_PAGE_TITLE)}</h1>
      </AuthCardHeader>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <BlackAuthCardNavLink to={AUTH_LOGIN_URL}>
          <Icon
            icon="arrow-left"
            style={{ marginRight: props.theme.spaces[3] }}
          />
          {createMessage(RESET_PASSWORD_LOGIN_LINK_TEXT)}
        </BlackAuthCardNavLink>
      </div>
      {(showSuccessMessage || showFailureMessage) && (
        <FormMessage {...messageTagProps} />
      )}
      <StyledForm onSubmit={handleSubmit(resetPasswordSubmitHandler)}>
        <FormGroup
          intent={error ? "danger" : "none"}
          label={createMessage(RESET_PASSWORD_PAGE_PASSWORD_INPUT_LABEL)}
        >
          <FormTextField
            disabled={submitSucceeded}
            name="password"
            placeholder={createMessage(
              RESET_PASSWORD_PAGE_PASSWORD_INPUT_PLACEHOLDER,
            )}
            type="password"
          />
        </FormGroup>
        <Field component="input" name="email" type="hidden" />
        <Field component="input" name="token" type="hidden" />
        <FormActions>
          <Button
            disabled={pristine || submitSucceeded}
            fill
            isLoading={submitting}
            size={Size.large}
            tag="button"
            text={createMessage(RESET_PASSWORD_SUBMIT_BUTTON_TEXT)}
            type="submit"
          />
        </FormActions>
      </StyledForm>
    </>
  );
}

export default connect(
  (state: AppState, props: ResetPasswordProps) => {
    const queryParams = new URLSearchParams(props.location.search);
    return {
      initialValues: {
        token: queryParams.get("token") || undefined,
      },
      isTokenValid: getIsTokenValid(state),
      validatingToken: getIsValidatingToken(state),
    };
  },
  (dispatch: any) => ({
    verifyToken: (token: string) =>
      dispatch({
        type: ReduxActionTypes.RESET_PASSWORD_VERIFY_TOKEN_INIT,
        payload: { token },
      }),
  }),
)(
  reduxForm<
    ResetPasswordFormValues,
    {
      verifyToken: (token: string) => void;
      validatingToken: boolean;
      isTokenValid: boolean;
    }
  >({
    validate,
    form: RESET_PASSWORD_FORM_NAME,
    touchOnBlur: true,
  })(withRouter(withTheme(ResetPassword))),
);
