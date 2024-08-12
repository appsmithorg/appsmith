import React, { useLayoutEffect } from "react";
import type { AppState } from "ee/reducers";
import type { RouteComponentProps } from "react-router-dom";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import type { InjectedFormProps } from "redux-form";
import { reduxForm, Field } from "redux-form";
import { RESET_PASSWORD_FORM_NAME } from "ee/constants/forms";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getIsTokenValid, getIsValidatingToken } from "selectors/authSelectors";
import FormTextField from "components/utils/ReduxFormTextField";
import { Button, Callout, Icon, Link } from "@appsmith/ads";
import Spinner from "components/editorComponents/Spinner";
import StyledForm from "components/editorComponents/Form";
import { isEmptyString, isStrongPassword } from "utils/formhelpers";
import type { ResetPasswordFormValues } from "./helpers";
import { resetPasswordSubmitHandler } from "./helpers";
import { FormActions, StyledFormGroup } from "./StyledComponents";
import { AUTH_LOGIN_URL, FORGOT_PASSWORD_URL } from "constants/routes";
import {
  RESET_PASSWORD_PAGE_PASSWORD_INPUT_LABEL,
  RESET_PASSWORD_PAGE_PASSWORD_INPUT_PLACEHOLDER,
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
} from "ee/constants/messages";
import Container from "./Container";
import type { CalloutProps } from "@appsmith/ads";

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

  useLayoutEffect(() => {
    if (initialValues.token) verifyToken(initialValues.token);
  }, [initialValues.token, verifyToken]);

  const showInvalidMessage = !initialValues.token;
  const showExpiredMessage = !isTokenValid && !validatingToken;
  const showSuccessMessage = submitSucceeded && !pristine;
  const showFailureMessage = submitFailed && !!error;

  let message = "";
  let messageActions = undefined;
  if (showExpiredMessage || showInvalidMessage) {
    const messageActionText = createMessage(
      RESET_PASSWORD_FORGOT_PASSWORD_LINK,
    );
    messageActions = [
      {
        to: FORGOT_PASSWORD_URL,
        children: messageActionText,
        target: "_self",
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
        to: AUTH_LOGIN_URL,
        children: messageActionText,
        target: "_self",
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
          to: FORGOT_PASSWORD_URL,
          children: messageActionText,
          target: "_self",
        },
      ];
    }
  }

  const messageTagProps: CalloutProps = {
    kind:
      showInvalidMessage || showExpiredMessage || showFailureMessage
        ? "error"
        : "success",
    links: messageActions,
    children: message,
  };

  if (showInvalidMessage || showExpiredMessage) {
    return <Callout {...messageTagProps} />;
  }

  if (!isTokenValid && validatingToken) {
    return <Spinner />;
  }

  const footerSection = (
    <div className="px-2 flex items-center justify-center text-center text-[color:var(--ads-v2\-color-fg)] text-[14px]">
      <Icon name="arrow-left-line" size="md" />
      &nbsp; Back to &nbsp;
      <Link
        className="text-sm justify-center"
        kind="primary"
        target="_self"
        to={AUTH_LOGIN_URL}
      >
        Sign in
      </Link>
    </div>
  );

  return (
    <Container
      footer={footerSection}
      title={createMessage(RESET_PASSWORD_PAGE_TITLE)}
    >
      {(showSuccessMessage || showFailureMessage) && (
        <Callout {...messageTagProps} />
      )}
      <StyledForm onSubmit={handleSubmit(resetPasswordSubmitHandler)}>
        <StyledFormGroup
          className="text-[color:var(--ads-v2\-color-fg)]"
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
        </StyledFormGroup>
        <Field component="input" name="email" type="hidden" />
        <Field component="input" name="token" type="hidden" />
        <FormActions>
          <Button
            isDisabled={pristine || submitSucceeded}
            isLoading={submitting}
            size="md"
            type="submit"
          >
            {createMessage(RESET_PASSWORD_SUBMIT_BUTTON_TEXT)}
          </Button>
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
