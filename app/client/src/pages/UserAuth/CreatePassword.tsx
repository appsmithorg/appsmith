import React, { useLayoutEffect } from "react";
import { AppState } from "reducers";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { connect } from "react-redux";
import { InjectedFormProps, reduxForm, Field } from "redux-form";
import { CREATE_PASSWORD_FORM_NAME } from "constants/forms";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getIsTokenValid, getIsValidatingToken } from "selectors/authSelectors";
import FormTextField from "components/editorComponents/form/FormTextField";
import FormMessage, {
  FormMessageProps,
  MessageAction,
} from "components/editorComponents/form/FormMessage";
import Spinner from "components/editorComponents/Spinner";
import Button from "components/editorComponents/Button";
import FormGroup from "components/editorComponents/form/FormGroup";
import StyledForm from "components/editorComponents/Form";
import { isEmptyString, isStrongPassword } from "utils/formhelpers";

import {
  CreatePasswordFormValues,
  createPasswordSubmitHandler,
} from "./helpers";
import {
  AuthCardHeader,
  AuthCardFooter,
  AuthCardContainer,
  AuthCardBody,
  AuthCardNavLink,
  FormActions,
} from "./StyledComponents";
import { AUTH_LOGIN_URL } from "constants/routes";

import {
  CREATE_PASSWORD_PAGE_PASSWORD_INPUT_LABEL,
  CREATE_PASSWORD_PAGE_PASSWORD_INPUT_PLACEHOLDER,
  CREATE_PASSWORD_LOGIN_LINK_TEXT,
  CREATE_PASSWORD_SUBMIT_BUTTON_TEXT,
  CREATE_PASSWORD_PAGE_SUBTITLE,
  CREATE_PASSWORD_PAGE_TITLE,
  FORM_VALIDATION_INVALID_PASSWORD,
  FORM_VALIDATION_EMPTY_PASSWORD,
  CREATE_PASSWORD_EXPIRED_TOKEN,
  CREATE_PASSWORD_INVALID_TOKEN,
  CREATE_PASSWORD_RESET_SUCCESS,
  CREATE_PASSWORD_RESET_SUCCESS_LOGIN_LINK,
} from "constants/messages";
import { TncPPLinks } from "./SignUp";

const validate = (values: CreatePasswordFormValues) => {
  const errors: CreatePasswordFormValues = {};
  if (!values.password || isEmptyString(values.password)) {
    errors.password = FORM_VALIDATION_EMPTY_PASSWORD;
  } else if (!isStrongPassword(values.password)) {
    errors.password = FORM_VALIDATION_INVALID_PASSWORD;
  }
  return errors;
};

type CreatePasswordProps = InjectedFormProps<
  CreatePasswordFormValues,
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

export const CreatePassword = (props: CreatePasswordProps) => {
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
    valid,
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

  if (showExpiredMessage) {
    message = CREATE_PASSWORD_EXPIRED_TOKEN;
  }
  if (showInvalidMessage) {
    message = CREATE_PASSWORD_INVALID_TOKEN;
  }

  if (showSuccessMessage) {
    message = CREATE_PASSWORD_RESET_SUCCESS;
    messageActions = [
      {
        url: AUTH_LOGIN_URL,
        text: CREATE_PASSWORD_RESET_SUCCESS_LOGIN_LINK,
        intent: "primary",
      },
    ];
  }
  if (showFailureMessage) {
    message = error;
  }

  const messageTagProps: FormMessageProps = {
    intent:
      showInvalidMessage || showExpiredMessage || showFailureMessage
        ? "danger"
        : "primary",
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
    <AuthCardContainer>
      {(showSuccessMessage || showFailureMessage) && (
        <FormMessage {...messageTagProps} />
      )}
      <AuthCardHeader>
        <h1>{CREATE_PASSWORD_PAGE_TITLE}</h1>
        <h5>{CREATE_PASSWORD_PAGE_SUBTITLE}</h5>
      </AuthCardHeader>
      <AuthCardBody>
        <StyledForm onSubmit={handleSubmit(createPasswordSubmitHandler)}>
          <FormGroup
            intent={error ? "danger" : "none"}
            label={CREATE_PASSWORD_PAGE_PASSWORD_INPUT_LABEL}
          >
            <FormTextField
              name="password"
              type="password"
              placeholder={CREATE_PASSWORD_PAGE_PASSWORD_INPUT_PLACEHOLDER}
            />
          </FormGroup>
          <Field type="hidden" name="email" component="input" />
          <Field type="hidden" name="token" component="input" />
          <FormActions>
            <Button
              filled
              size="large"
              type="submit"
              text={CREATE_PASSWORD_SUBMIT_BUTTON_TEXT}
              intent="primary"
              disabled={pristine || !valid}
              loading={submitting}
            />
          </FormActions>
        </StyledForm>
      </AuthCardBody>
      <AuthCardNavLink to={AUTH_LOGIN_URL}>
        {CREATE_PASSWORD_LOGIN_LINK_TEXT}
      </AuthCardNavLink>
      <AuthCardFooter>
        <TncPPLinks></TncPPLinks>
      </AuthCardFooter>
    </AuthCardContainer>
  );
};

export default connect(
  (state: AppState, props: CreatePasswordProps) => {
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
        type: ReduxActionTypes.VERIFY_INVITE_INIT,
        payload: { token, email },
      }),
  }),
)(
  reduxForm<
    CreatePasswordFormValues,
    {
      verifyToken: (token: string, email: string) => void;
      validatingToken: boolean;
      isTokenValid: boolean;
    }
  >({
    validate,
    form: CREATE_PASSWORD_FORM_NAME,
    touchOnBlur: true,
  })(withRouter(CreatePassword)),
);
