import { createMessage, PREMIUM_DATASOURCES } from "ee/constants/messages";
import AnalyticsUtil from "./AnalyticsUtil";
import { isRelevantEmail } from "utils/formhelpers";

export const handlePremiumDatasourceClick = (integrationName: string) => {
  AnalyticsUtil.logEvent("PREMIUM_INTEGRATION_CTA", {
    integration_name: integrationName,
  });
};

export const handleLearnMoreClick = (
  integrationName: string,
  email: string,
  redirectPricingURL: string,
) => {
  const validRelevantEmail = isRelevantEmail(email);

  AnalyticsUtil.logEvent(
    validRelevantEmail
      ? "PREMIUM_MODAL_RELEVANT_LEARN_MORE"
      : "PREMIUM_MODAL_NOT_RELEVANT_LEARN_MORE",
    {
      integration_name: integrationName,
      email,
    },
  );

  window.open(redirectPricingURL, "_blank");
};

export const handleSubmitEvent = (integrationName: string, email: string) => {
  const validRelevantEmail = isRelevantEmail(email);

  AnalyticsUtil.logEvent(
    validRelevantEmail
      ? "PREMIUM_MODAL_RELEVANT_SCHEDULE_CALL"
      : "PREMIUM_MODAL_NOT_RELEVANT_SUBMIT",
    {
      integration_name: integrationName,
      email,
    },
  );
};

export const getContactFormModalTitle = (integrationName: string) => {
  return integrationName;
};

export const getContactFormModalDescription = (email: string) => {
  const validRelevantEmail = isRelevantEmail(email);

  return validRelevantEmail
    ? createMessage(PREMIUM_DATASOURCES.RELEVANT_EMAIL_DESCRIPTION)
    : createMessage(PREMIUM_DATASOURCES.NON_RELEVANT_EMAIL_DESCRIPTION);
};

export const shouldLearnMoreButtonBeVisible = () => {
  return true;
};

export const getContactFormSubmitButtonText = (email: string) => {
  const validRelevantEmail = isRelevantEmail(email);

  return validRelevantEmail
    ? createMessage(PREMIUM_DATASOURCES.SCHEDULE_CALL)
    : createMessage(PREMIUM_DATASOURCES.SUBMIT);
};
