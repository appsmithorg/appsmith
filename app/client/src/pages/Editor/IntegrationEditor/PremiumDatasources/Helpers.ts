import { SCHEDULE_CALL_URL } from "./Constants";
import { createMessage, PREMIUM_DATASOURCES } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { isRelevantEmail } from "utils/formhelpers";

export const getTagText = (isBusinessOrEnterprise?: boolean) => {
  return isBusinessOrEnterprise
    ? createMessage(PREMIUM_DATASOURCES.SOON_TAG)
    : createMessage(PREMIUM_DATASOURCES.PREMIUM_TAG);
};

export const handlePremiumDatasourceClick = (
  integrationName: string,
  isBusinessOrEnterprise?: boolean,
) => {
  AnalyticsUtil.logEvent(
    isBusinessOrEnterprise ? "SOON_INTEGRATION_CTA" : "PREMIUM_INTEGRATION_CTA",
    {
      integration_name: integrationName,
    },
  );
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

export const handleSubmitEvent = (
  integrationName: string,
  email: string,
  isBusinessOrEnterprise?: boolean,
) => {
  const validRelevantEmail = isRelevantEmail(email);

  AnalyticsUtil.logEvent(
    isBusinessOrEnterprise
      ? "SOON_NOTIFY_REQUEST"
      : validRelevantEmail
        ? "PREMIUM_MODAL_RELEVANT_SCHEDULE_CALL"
        : "PREMIUM_MODAL_NOT_RELEVANT_SUBMIT",
    {
      integration_name: integrationName,
      email,
    },
  );

  const scheduleACallUrl =
    !isBusinessOrEnterprise && validRelevantEmail
      ? `${SCHEDULE_CALL_URL}?email=${email}`
      : "";

  if (scheduleACallUrl) {
    window.open(scheduleACallUrl, "_blank");
  }
};

export const getContactFormModalTitle = (
  integrationName: string,
  isBusinessOrEnterprise?: boolean,
) => {
  return `${isBusinessOrEnterprise ? "Integration to " : ""}${integrationName} ${isBusinessOrEnterprise ? `- ${createMessage(PREMIUM_DATASOURCES.COMING_SOON_SUFFIX)}` : ""}`;
};

export const getContactFormModalDescription = (
  email: string,
  integrationName: string,
  isBusinessOrEnterprise?: boolean,
) => {
  const validRelevantEmail = isRelevantEmail(email);

  return isBusinessOrEnterprise
    ? createMessage(PREMIUM_DATASOURCES.COMING_SOON_DESCRIPTION)
    : validRelevantEmail
      ? createMessage(
          PREMIUM_DATASOURCES.RELEVANT_EMAIL_DESCRIPTION,
          integrationName,
        )
      : createMessage(
          PREMIUM_DATASOURCES.NON_RELEVANT_EMAIL_DESCRIPTION,
          integrationName,
        );
};

export const shouldLearnMoreButtonBeVisible = (
  isBusinessOrEnterprise?: boolean,
) => {
  return !isBusinessOrEnterprise;
};

export const getContactFormSubmitButtonText = (
  email: string,
  isBusinessOrEnterprise?: boolean,
) => {
  const validRelevantEmail = isRelevantEmail(email);

  return isBusinessOrEnterprise
    ? createMessage(PREMIUM_DATASOURCES.NOTIFY_ME)
    : validRelevantEmail
      ? createMessage(PREMIUM_DATASOURCES.SCHEDULE_CALL)
      : createMessage(PREMIUM_DATASOURCES.SUBMIT);
};
