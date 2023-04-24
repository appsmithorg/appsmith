import React, { useLayoutEffect } from "react";
import type { AppState } from "@appsmith/reducers";
import type { RouteComponentProps } from "react-router-dom";
import { Link, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import type { InjectedFormProps } from "redux-form";
import { reduxForm, Field } from "redux-form";
import { RESET_PASSWORD_FORM_NAME } from "@appsmith/constants/forms";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getIsTokenValid, getIsValidatingToken } from "selectors/authSelectors";
import { Icon } from "@blueprintjs/core";
import FormTextField from "components/utils/ReduxFormTextField";
import type { FormMessageProps, MessageAction } from "design-system-old";
import { Button, FormGroup, FormMessage, Size } from "design-system-old";
import Spinner from "components/editorComponents/Spinner";
import StyledForm from "components/editorComponents/Form";
import { isEmptyString, isStrongPassword } from "utils/formhelpers";
import type { ResetPasswordFormValues } from "./helpers";
import { resetPasswordSubmitHandler } from "./helpers";
import { BlackAuthCardNavLink, FormActions } from "./StyledComponents";
import { AUTH_LOGIN_URL, FORGOT_PASSWORD_URL } from "constants/routes";
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
import Container from "./Container";
import { useTheme } from "styled-components";
import type { Theme } from "constants/DefaultTheme";

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

  const theme = useTheme() as Theme;

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
    const messageActionText = createMessage(
      RESET_PASSWORD_FORGOT_PASSWORD_LINK,
    );
    messageActions = [
      {
        linkElement: <Link to={FORGOT_PASSWORD_URL}>{messageActionText}</Link>,
        text: messageActionText,
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
    const messageActionText = createMessage(
      RESET_PASSWORD_RESET_SUCCESS_LOGIN_LINK,
    );
    message = createMessage(RESET_PASSWORD_RESET_SUCCESS);
    messageActions = [
      {
        linkElement: <Link to={AUTH_LOGIN_URL}>{messageActionText}</Link>,
        text: messageActionText,
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
      const messageActionText = createMessage(
        RESET_PASSWORD_FORGOT_PASSWORD_LINK,
      );
      messageActions = [
        {
          linkElement: (
            <Link to={FORGOT_PASSWORD_URL}>{messageActionText}</Link>
          ),
          text: messageActionText,
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
    <Container
      subtitle={
        <BlackAuthCardNavLink className="text-sm" to={AUTH_LOGIN_URL}>
          <Icon icon="arrow-left" style={{ marginRight: theme.spaces[3] }} />
          {createMessage(RESET_PASSWORD_LOGIN_LINK_TEXT)}
        </BlackAuthCardNavLink>
      }
      title={createMessage(RESET_PASSWORD_PAGE_TITLE)}
    >
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
    </Container>
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
  })(withRouter(ResetPassword)),
);
