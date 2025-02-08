import { Button, ModalFooter, ModalHeader, Text, toast } from "@appsmith/ads";
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
} from "./Helpers";
import { PREMIUM_INTEGRATION_CONTACT_FORM } from "./Constants";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

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
  // We are using this feature flag to identify whether its the enterprise/business user - ref : https://www.notion.so/appsmith/Condition-for-showing-Premium-Soon-tag-datasources-184fe271b0e2802cb55bd63f468df60d
  const isGACEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

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
    handleSubmitEvent(props.integrationName, props.email || "", isGACEnabled);
  }, [props.email, props.integrationName, isGACEnabled]);

  return (
    <>
      <ModalHeader>
        {getContactFormModalTitle(props.integrationName, isGACEnabled)}
      </ModalHeader>
      <FormWrapper onSubmit={props.handleSubmit(onSubmit)}>
        <Text renderAs="p">
          {getContactFormModalDescription(
            props.email || "",
            props.integrationName,
            isGACEnabled,
          )}
        </Text>
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
        <ModalFooter>
          {shouldLearnMoreButtonBeVisible(isGACEnabled) && (
            <Button
              aria-label="Learn more"
              kind="secondary"
              onClick={onClickLearnMore}
              size="md"
            >
              {createMessage(PREMIUM_DATASOURCES.LEARN_MORE)}
            </Button>
          )}
          <Button isDisabled={props.invalid} size="md" type="submit">
            {getContactFormSubmitButtonText(props.email || "", isGACEnabled)}
          </Button>
        </ModalFooter>
      </FormWrapper>
    </>
  );
};

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
