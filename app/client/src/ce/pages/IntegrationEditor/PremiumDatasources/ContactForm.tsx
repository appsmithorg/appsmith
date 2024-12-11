import { Button, Flex, ModalHeader, toast } from "@appsmith/ads";
import { createMessage, PREMIUM_DATASOURCES } from "ee/constants/messages";
import type { AppState } from "ee/reducers";
import React, { useCallback } from "react";
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
import { isEmail, isRelevantEmail } from "utils/formhelpers";
import ReduxFormTextField from "components/utils/ReduxFormTextField";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { ENTERPRISE_PRICING_PAGE } from "constants/ThirdPartyConstants";

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--ads-spaces-7);
`;

const PremiumDatasourceContactForm = (
  props: PremiumDatasourceContactFormProps,
) => {
  const onSubmit = () => {
    submitEvent();
    toast.show(createMessage(PREMIUM_DATASOURCES.SUCCESS_TOAST_MESSAGE), {
      kind: "success",
    });
    props.closeModal();
  };

  const validRelevantEmail = isRelevantEmail(props.email || "");

  const onClickLearnMore = useCallback(() => {
    AnalyticsUtil.logEvent(
      validRelevantEmail
        ? "PREMIUM_MODAL_RELEVANT_LEARN_MORE"
        : "PREMIUM_MODAL_NOT_RELEVANT_LEARN_MORE",
      {
        integration_name: props.integrationName,
        email: props.email,
      },
    );
    window.open(ENTERPRISE_PRICING_PAGE, "_blank");
  }, [props.email, props.integrationName]);

  const submitEvent = useCallback(() => {
    AnalyticsUtil.logEvent(
      props.isEnterprise
        ? "SOON_NOTIFY_REQUEST"
        : validRelevantEmail
          ? "PREMIUM_MODAL_RELEVANT_SCHEDULE_CALL"
          : "PREMIUM_MODAL_NOT_RELEVANT_SUBMIT",
      {
        integration_name: props.integrationName,
        email: props.email,
      },
    );
  }, [props.email, props.integrationName, props.isEnterprise]);

  return (
    <>
      <ModalHeader>{`${props.integrationName} ${props.isEnterprise ? `- ${createMessage(PREMIUM_DATASOURCES.COMING_SOON_SUFFIX)}` : ""}`}</ModalHeader>
      <FormWrapper onSubmit={props.handleSubmit(onSubmit)}>
        <p>
          {props.isEnterprise
            ? createMessage(PREMIUM_DATASOURCES.COMING_SOON_DESCRIPTION)
            : validRelevantEmail
              ? createMessage(PREMIUM_DATASOURCES.RELEVANT_EMAIL_DESCRIPTION)
              : createMessage(
                  PREMIUM_DATASOURCES.NON_RELEVANT_EMAIL_DESCRIPTION,
                )}
        </p>
        <Field
          component={ReduxFormTextField}
          description={createMessage(
            PREMIUM_DATASOURCES.FORM_EMAIL.DESCRIPTION,
          )}
          label={createMessage(PREMIUM_DATASOURCES.FORM_EMAIL.LABEL)}
          name={PREMIUM_DATASOURCES.FORM_EMAIL.NAME}
          size="md"
          type="email"
        />
        <Flex gap="spaces-7" justifyContent="flex-end" marginTop="spaces-3">
          {!props.isEnterprise && (
            <Button
              aria-label="Close"
              kind="secondary"
              onClick={onClickLearnMore}
              size="md"
            >
              {createMessage(PREMIUM_DATASOURCES.LEARN_MORE)}
            </Button>
          )}
          <Button isDisabled={props.invalid} size="md" type="submit">
            {props.isEnterprise
              ? createMessage(PREMIUM_DATASOURCES.NOTIFY_ME)
              : validRelevantEmail
                ? createMessage(PREMIUM_DATASOURCES.SCHEDULE_CALL)
                : createMessage(PREMIUM_DATASOURCES.SUBMIT)}
          </Button>
        </Flex>
      </FormWrapper>
    </>
  );
};

const PREMIUM_INTEGRATION_CONTACT_FORM = "PREMIUM_INTEGRATION_CONTACT_FORM";

const selector = formValueSelector(PREMIUM_INTEGRATION_CONTACT_FORM);

interface PremiumDatasourceContactFormValues {
  email?: string;
}

type PremiumDatasourceContactFormProps = PremiumDatasourceContactFormValues & {
  formSyncErrors?: FormErrors<string, string>;
  closeModal: () => void;
  integrationName: string;
  isEnterprise: boolean;
} & InjectedFormProps<
    PremiumDatasourceContactFormValues,
    {
      formSyncErrors?: FormErrors<string, string>;
      closeModal: () => void;
      integrationName: string;
      isEnterprise: boolean;
    }
  >;

const validate = (values: PremiumDatasourceContactFormValues) => {
  const errors: Partial<PremiumDatasourceContactFormValues> = {};

  if (!values.email || !isEmail(values.email)) {
    errors.email = createMessage(PREMIUM_DATASOURCES.FORM_EMAIL.ERROR);
  }

  return errors;
};

export default connect((state: AppState) => {
  const currentUser = getCurrentUser(state);

  return {
    email: selector(state, "email"),
    initialValues: {
      email: currentUser?.email,
    },
    formSyncErrors: getFormSyncErrors(PREMIUM_INTEGRATION_CONTACT_FORM)(state),
  };
}, null)(
  reduxForm<
    PremiumDatasourceContactFormValues,
    {
      formSyncErrors?: FormErrors<string, string>;
      closeModal: () => void;
      integrationName: string;
      isEnterprise: boolean;
    }
  >({
    validate,
    form: PREMIUM_INTEGRATION_CONTACT_FORM,
    enableReinitialize: true,
  })(PremiumDatasourceContactForm),
);
