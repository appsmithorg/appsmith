import React from "react";
import { connect } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { reduxForm, InjectedFormProps, formValueSelector } from "redux-form";
import StyledForm from "components/editorComponents/Form";
import {
  AuthCardContainer,
  AuthCardHeader,
  AuthCardBody,
  FormActions,
} from "./StyledComponents";
import {
  FORGOT_PASSWORD_PAGE_EMAIL_INPUT_LABEL,
  FORGOT_PASSWORD_PAGE_EMAIL_INPUT_PLACEHOLDER,
  FORGOT_PASSWORD_PAGE_SUBMIT_BUTTON_TEXT,
  FORGOT_PASSWORD_PAGE_SUBTITLE,
  FORGOT_PASSWORD_PAGE_TITLE,
  FORM_VALIDATION_EMPTY_EMAIL,
  FORM_VALIDATION_INVALID_EMAIL,
  FORGOT_PASSWORD_SUCCESS_TEXT,
} from "constants/messages";

import MessageTag from "components/editorComponents/form/MessageTag";

import { FORGOT_PASSWORD_FORM_NAME } from "constants/forms";
import FormGroup from "components/editorComponents/FormGroup";
import FormButton from "components/editorComponents/FormButton";
import TextField from "components/editorComponents/form/fields/TextField";
import { isEmail, isEmptyString } from "utils/formhelpers";
import {
  ForgotPasswordFormValues,
  forgotPasswordSubmitHandler,
} from "./helpers";

const validate = (values: ForgotPasswordFormValues) => {
  const errors: ForgotPasswordFormValues = {};
  if (!values.email || isEmptyString(values.email)) {
    errors.email = FORM_VALIDATION_EMPTY_EMAIL;
  } else if (!isEmail(values.email)) {
    errors.email = FORM_VALIDATION_INVALID_EMAIL;
  }
  return errors;
};

type ForgotPasswordProps = InjectedFormProps<
  ForgotPasswordFormValues,
  { emailValue: string }
> &
  RouteComponentProps<{ email: string }> & { emailValue: string };

export const ForgotPassword = (props: ForgotPasswordProps) => {
  const {
    error,
    handleSubmit,
    pristine,
    submitting,
    submitFailed,
    submitSucceeded,
  } = props;
  const queryParams = new URLSearchParams(props.location.search);
  const hasEmail = queryParams.get("email");
  return (
    <AuthCardContainer>
      {submitSucceeded && (
        <MessageTag
          intent="success"
          message={`${FORGOT_PASSWORD_SUCCESS_TEXT} ${props.emailValue}`}
        />
      )}
      {submitFailed && error && <MessageTag intent="danger" message={error} />}
      <AuthCardHeader>
        <h1>{FORGOT_PASSWORD_PAGE_TITLE}</h1>
        <h5>{FORGOT_PASSWORD_PAGE_SUBTITLE}</h5>
      </AuthCardHeader>
      <AuthCardBody>
        <StyledForm onSubmit={handleSubmit(forgotPasswordSubmitHandler)}>
          <FormGroup
            intent={error ? "danger" : "none"}
            label={FORGOT_PASSWORD_PAGE_EMAIL_INPUT_LABEL}
          >
            <TextField
              name="email"
              placeholder={FORGOT_PASSWORD_PAGE_EMAIL_INPUT_PLACEHOLDER}
              showError
              disabled={submitting}
            />
          </FormGroup>
          <FormActions>
            <FormButton
              type="submit"
              text={FORGOT_PASSWORD_PAGE_SUBMIT_BUTTON_TEXT}
              intent="primary"
              disabled={pristine && !hasEmail}
              loading={submitting}
            />
          </FormActions>
        </StyledForm>
      </AuthCardBody>
    </AuthCardContainer>
  );
};

const selector = formValueSelector(FORGOT_PASSWORD_FORM_NAME);

export default connect((state, props: ForgotPasswordProps) => {
  const queryParams = new URLSearchParams(props.location.search);
  return {
    initialValues: {
      email: queryParams.get("email") || "",
    },
    emailValue: selector(state, "email"),
  };
})(
  reduxForm<ForgotPasswordFormValues, { emailValue: string }>({
    validate,
    form: FORGOT_PASSWORD_FORM_NAME,
    touchOnBlur: true,
  })(withRouter(ForgotPassword)),
);
