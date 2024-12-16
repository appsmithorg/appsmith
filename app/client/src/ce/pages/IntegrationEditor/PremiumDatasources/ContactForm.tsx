import { Button, Flex, ModalHeader, toast } from "@appsmith/ads";
import { createMessage, PREMIUM_DATASOURCES } from "ee/constants/messages";
import type { AppState } from "ee/reducers";
import React, { useCallback } from "react";
import { connect, useSelector } from "react-redux";
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
import { PRICING_PAGE_URL } from "constants/ThirdPartyConstants";
import { getAppsmithConfigs } from "ee/configs";
import { getInstanceId } from "ee/selectors/tenantSelectors";
import { pricingPageUrlSource } from "ee/utils/licenseHelpers";
import { RampFeature, RampSection } from "utils/ProductRamps/RampsControlList";
import {
  getContactFormModalDescription,
  getContactFormModalTitle,
  getContactFormSubmitButtonText,
  handleLearnMoreClick,
  handleSubmitEvent,
  shouldLearnMoreButtonBeVisible,
} from "ee/utils/PremiumDatasourcesHelpers";

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--ads-spaces-7);
`;

const PremiumDatasourceContactForm = (
  props: PremiumDatasourceContactFormProps,
) => {
  const instanceId = useSelector(getInstanceId);
  const appsmithConfigs = getAppsmithConfigs();

  const redirectPricingURL = PRICING_PAGE_URL(
    appsmithConfigs.pricingUrl,
    pricingPageUrlSource,
    instanceId,
    RampFeature.PremiumDatasources,
    RampSection.PremiumDatasourcesContactModal,
  );

  const onSubmit = () => {
    submitEvent();
    toast.show(createMessage(PREMIUM_DATASOURCES.SUCCESS_TOAST_MESSAGE), {
      kind: "success",
    });
    props.closeModal();
  };

  const onClickLearnMore = useCallback(() => {
    handleLearnMoreClick(
      props.integrationName,
      props.email || "",
      redirectPricingURL,
    );
  }, [redirectPricingURL, props.email, props.integrationName]);

  const submitEvent = useCallback(() => {
    handleSubmitEvent(props.integrationName, props.email || "");
  }, [props.email, props.integrationName]);

  return (
    <>
      <ModalHeader>
        {getContactFormModalTitle(props.integrationName)}
      </ModalHeader>
      <FormWrapper onSubmit={props.handleSubmit(onSubmit)}>
        <p>{getContactFormModalDescription(props.email || "")}</p>
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
          {shouldLearnMoreButtonBeVisible() && (
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
            {getContactFormSubmitButtonText(props.email || "")}
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
} & InjectedFormProps<
    PremiumDatasourceContactFormValues,
    {
      formSyncErrors?: FormErrors<string, string>;
      closeModal: () => void;
      integrationName: string;
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
    }
  >({
    validate,
    form: PREMIUM_INTEGRATION_CONTACT_FORM,
    enableReinitialize: true,
  })(PremiumDatasourceContactForm),
);
