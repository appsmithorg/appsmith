import { Button, ModalFooter, toast } from "@appsmith/ads";
import { Close } from "@radix-ui/react-dialog";
import { createMessage, REQUEST_NEW_INTEGRATIONS } from "ee/constants/messages";
import type { DefaultRootState } from "react-redux";
import React from "react";
import { connect } from "react-redux";
import {
  Field,
  formValueSelector,
  getFormSyncErrors,
  reduxForm,
  type FormErrors,
  type InjectedFormProps,
} from "redux-form";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import { isEmail } from "utils/formhelpers";
import ReduxFormTextField from "components/utils/ReduxFormTextField";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--ads-spaces-5);
`;

const RequestIntegrationForm = (props: RequestIntegrationFormProps) => {
  const onSubmit = (values: RequestIntegrationFormValues) => {
    AnalyticsUtil.logEvent("REQUEST_INTEGRATION_SUBMITTED", {
      integration_name: values.integration,
      use_case_description: values.useCase || "",
      email: values.email,
    });
    toast.show(createMessage(REQUEST_NEW_INTEGRATIONS.SUCCESS_TOAST_MESSAGE), {
      kind: "success",
    });
    props.closeModal();
  };

  return (
    <FormWrapper onSubmit={props.handleSubmit(onSubmit)}>
      <Field
        component={ReduxFormTextField}
        isRequired
        label={createMessage(
          REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_INTEGRATION.LABEL,
        )}
        name={REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_INTEGRATION.NAME}
        placeholder={createMessage(
          REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_INTEGRATION.PLACEHOLDER,
        )}
        size="md"
      />
      <Field
        component={ReduxFormTextField}
        label={createMessage(
          REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_USECASE.LABEL,
        )}
        name={REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_USECASE.NAME}
        placeholder={createMessage(
          REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_USECASE.PLACEHOLDER,
        )}
        size="md"
        type="textarea"
      />
      <Field
        component={ReduxFormTextField}
        description={createMessage(
          REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_EMAIL.DESCRIPTION,
        )}
        label={createMessage(
          REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_EMAIL.LABEL,
        )}
        name={REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_EMAIL.NAME}
        size="md"
        type="email"
      />
      <ModalFooter>
        <Close>
          <Button aria-label="Close" kind="secondary" size="md">
            {createMessage(REQUEST_NEW_INTEGRATIONS.CANCEL_BUTTON)}
          </Button>
        </Close>
        <Button isDisabled={props.invalid} size="md" type="submit">
          {createMessage(REQUEST_NEW_INTEGRATIONS.REQUEST_BUTTON)}
        </Button>
      </ModalFooter>
    </FormWrapper>
  );
};

const REQUEST_NEW_INTEGRATION_FORM_NAME = "REQUEST_NEW_INTEGRATION";

const selector = formValueSelector(REQUEST_NEW_INTEGRATION_FORM_NAME);

interface RequestIntegrationFormValues {
  integration?: string;
  email?: string;
  useCase?: string;
}

type RequestIntegrationFormProps = RequestIntegrationFormValues & {
  formSyncErrors?: FormErrors<string, string>;
  closeModal: () => void;
} & InjectedFormProps<
    RequestIntegrationFormValues,
    {
      formSyncErrors?: FormErrors<string, string>;
      closeModal: () => void;
    }
  >;

const validate = (values: RequestIntegrationFormValues) => {
  const errors: Partial<RequestIntegrationFormValues> = {};

  if (!values.integration) {
    errors.integration = createMessage(
      REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_INTEGRATION.ERROR,
    );
  }

  if (values.email && !isEmail(values.email)) {
    errors.email = createMessage(
      REQUEST_NEW_INTEGRATIONS.REQUEST_MODAL_EMAIL.ERROR,
    );
  }

  return errors;
};

export default connect((state: DefaultRootState) => {
  const currentUser = getCurrentUser(state);

  return {
    integration: selector(state, "integration"),
    email: selector(state, "email"),
    useCase: selector(state, "useCase"),
    initialValues: {
      email: currentUser?.email,
    },
    formSyncErrors: getFormSyncErrors(REQUEST_NEW_INTEGRATION_FORM_NAME)(state),
  };
}, null)(
  reduxForm<
    RequestIntegrationFormValues,
    {
      formSyncErrors?: FormErrors<string, string>;
      closeModal: () => void;
    }
  >({
    validate,
    form: REQUEST_NEW_INTEGRATION_FORM_NAME,
    enableReinitialize: true,
  })(RequestIntegrationForm),
);
