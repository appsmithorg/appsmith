import React, { useEffect } from "react";
import { connect, useDispatch } from "react-redux";
import type { RouteComponentProps } from "react-router-dom";
import { withRouter, Link } from "react-router-dom";
import type { InjectedFormProps } from "redux-form";
import { change, reduxForm, formValueSelector } from "redux-form";
import StyledForm from "components/editorComponents/Form";
import {
  FormActions,
  BlackAuthCardNavLink,
  FormMessagesContainer,
} from "./StyledComponents";
import {
  FORGOT_PASSWORD_PAGE_EMAIL_INPUT_LABEL,
  FORGOT_PASSWORD_PAGE_EMAIL_INPUT_PLACEHOLDER,
  FORGOT_PASSWORD_PAGE_SUBMIT_BUTTON_TEXT,
  FORGOT_PASSWORD_PAGE_TITLE,
  FORM_VALIDATION_EMPTY_EMAIL,
  FORM_VALIDATION_INVALID_EMAIL,
  FORGOT_PASSWORD_SUCCESS_TEXT,
  FORGOT_PASSWORD_PAGE_LOGIN_LINK,
  createMessage,
} from "@appsmith/constants/messages";
import { AUTH_LOGIN_URL } from "constants/routes";
import { FORGOT_PASSWORD_FORM_NAME } from "@appsmith/constants/forms";
import FormTextField from "components/utils/ReduxFormTextField";
import { Button, FormGroup, FormMessage, Size } from "design-system-old";
import { Icon } from "@blueprintjs/core";
import { isEmail, isEmptyString } from "utils/formhelpers";
import type { ForgotPasswordFormValues } from "./helpers";
import { forgotPasswordSubmitHandler } from "./helpers";
import { getAppsmithConfigs } from "@appsmith/configs";
import Container from "./Container";
import { useTheme } from "styled-components";
import type { Theme } from "constants/DefaultTheme";

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
  const theme = useTheme() as Theme;
  const dispatch = useDispatch();

  useEffect(() => {
    if (submitSucceeded) {
      props.reset();
      dispatch(change(FORGOT_PASSWORD_FORM_NAME, "email", ""));
    }
  }, [props.emailValue]);

  return (
    <Container
      subtitle={
        <BlackAuthCardNavLink className="text-sm" to={AUTH_LOGIN_URL}>
          <Icon icon="arrow-left" style={{ marginRight: theme.spaces[3] }} />
          {createMessage(FORGOT_PASSWORD_PAGE_LOGIN_LINK)}
        </BlackAuthCardNavLink>
      }
      title={createMessage(FORGOT_PASSWORD_PAGE_TITLE)}
    >
      <FormMessagesContainer>
        {submitSucceeded && (
          <FormMessage
            intent="lightSuccess"
            message={createMessage(
              FORGOT_PASSWORD_SUCCESS_TEXT,
              props.emailValue,
            )}
          />
        )}
        {!mailEnabled && (
          <FormMessage
            actions={[
              {
                linkElement: (
                  <a
                    href="https://docs.appsmith.com/v/v1.2.1/setup/docker/email"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Configure Email service
                  </a>
                ),
                text: "Configure Email service",
                intent: "primary",
              },
            ]}
            intent="warning"
            linkAs={Link}
            message={
              "You haven’t setup any email service yet. Please configure your email service to receive a reset link"
            }
          />
        )}
        {submitFailed && error && (
          <FormMessage intent="warning" message={error} />
        )}
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
            disabled={!isEmail(props.emailValue)}
            fill
            isLoading={submitting}
            size={Size.large}
            tag="button"
            text={createMessage(FORGOT_PASSWORD_PAGE_SUBMIT_BUTTON_TEXT)}
            type="submit"
          />
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
