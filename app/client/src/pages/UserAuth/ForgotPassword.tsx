import React, { useEffect } from "react";
import { connect, useDispatch } from "react-redux";
import type { RouteComponentProps } from "react-router-dom";
import { withRouter } from "react-router-dom";
import type { InjectedFormProps } from "redux-form";
import { change, reduxForm, formValueSelector } from "redux-form";
import StyledForm from "components/editorComponents/Form";
import { FormActions, FormMessagesContainer } from "./StyledComponents";
import {
  FORGOT_PASSWORD_PAGE_EMAIL_INPUT_LABEL,
  FORGOT_PASSWORD_PAGE_EMAIL_INPUT_PLACEHOLDER,
  FORGOT_PASSWORD_PAGE_SUBMIT_BUTTON_TEXT,
  FORGOT_PASSWORD_PAGE_TITLE,
  FORM_VALIDATION_EMPTY_EMAIL,
  FORM_VALIDATION_INVALID_EMAIL,
  FORGOT_PASSWORD_SUCCESS_TEXT,
  createMessage,
  FORGOT_PASSWORD_PAGE_SUB_TITLE,
} from "ee/constants/messages";
import { AUTH_LOGIN_URL } from "constants/routes";
import { FORGOT_PASSWORD_FORM_NAME } from "ee/constants/forms";
import FormTextField from "components/utils/ReduxFormTextField";
import { FormGroup } from "@appsmith/ads-old";
import { Button, Link, Callout, Icon } from "@appsmith/ads";
import { isEmail, isEmptyString } from "utils/formhelpers";
import type { ForgotPasswordFormValues } from "./helpers";
import { forgotPasswordSubmitHandler } from "./helpers";
import { getAppsmithConfigs } from "ee/configs";
import Container from "./Container";

const { mailEnabled } = getAppsmithConfigs();

const validate = (values: ForgotPasswordFormValues) => {
  const errors: ForgotPasswordFormValues = {};
  if (!values.email || isEmptyString(values.email)) {
    errors.email = createMessage(FORM_VALIDATION_EMPTY_EMAIL);
  } else if (!isEmail(values.email)) {
    errors.email = createMessage(FORM_VALIDATION_INVALID_EMAIL);
  }
  return errors;
};

type ForgotPasswordProps = InjectedFormProps<
  ForgotPasswordFormValues,
  { emailValue: string }
> &
  RouteComponentProps<{ email: string }> & { emailValue: string };

export const ForgotPassword = (props: ForgotPasswordProps) => {
  const { error, handleSubmit, submitFailed, submitSucceeded, submitting } =
    props;
  const dispatch = useDispatch();

  useEffect(() => {
    if (submitSucceeded) {
      props.reset();
      dispatch(change(FORGOT_PASSWORD_FORM_NAME, "email", ""));
    }
  }, [props.emailValue]);

  const footerSection = (
    <div className="px-2 flex items-center justify-center text-center text-[color:var(--ads-v2\-color-fg)] text-[14px]">
      <Icon name="arrow-left-line" size="md" />
      &nbsp;Back to&nbsp;
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
      subtitle={createMessage(FORGOT_PASSWORD_PAGE_SUB_TITLE)}
      title={createMessage(FORGOT_PASSWORD_PAGE_TITLE)}
    >
      <FormMessagesContainer>
        {submitSucceeded && (
          <Callout kind="success">
            {createMessage(FORGOT_PASSWORD_SUCCESS_TEXT, props.emailValue)}
          </Callout>
        )}
        {!mailEnabled && (
          <Callout
            kind="warning"
            links={[
              {
                to: "https://docs.appsmith.com/getting-started/setup/instance-configuration/email#configure-email",
                target: "_blank",
                children: "Configure email service",
              },
            ]}
          >
            You haven’t setup any email service yet. Please configure your email
            service to receive a reset link
          </Callout>
        )}
        {submitFailed && error && <Callout kind="warning">{error}</Callout>}
      </FormMessagesContainer>
      <StyledForm onSubmit={handleSubmit(forgotPasswordSubmitHandler)}>
        <FormGroup
          intent={error ? "danger" : "none"}
          label={createMessage(FORGOT_PASSWORD_PAGE_EMAIL_INPUT_LABEL)}
        >
          <FormTextField
            disabled={submitting}
            name="email"
            placeholder={createMessage(
              FORGOT_PASSWORD_PAGE_EMAIL_INPUT_PLACEHOLDER,
            )}
          />
        </FormGroup>
        <FormActions>
          <Button
            isDisabled={!isEmail(props.emailValue)}
            isLoading={submitting}
            size="md"
            type="submit"
          >
            {createMessage(FORGOT_PASSWORD_PAGE_SUBMIT_BUTTON_TEXT)}
          </Button>
        </FormActions>
      </StyledForm>
    </Container>
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
