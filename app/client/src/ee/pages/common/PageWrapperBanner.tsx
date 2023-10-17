import styled from "styled-components";
import { useSelector } from "react-redux";
import React from "react";
import {
  getRemainingDays,
  isAdminUser,
  isLicensePaymentFailed,
  isTrialExpiredLicense,
  isTrialActiveLicense,
  isPaidExpiredLicense,
} from "@appsmith/selectors/tenantSelectors";
import {
  CONTINUE_USING_FEATURES,
  createMessage,
  TRIAL_EXPIRY_WARNING,
  NON_ADMIN_USER_TRIAL_EXPIRTY_WARNING,
  VISIT_PORTAL_CTA,
  TRIAL_EXPIRED_TEXT,
  PAID_EXPIRED_TEXT,
  PAYMENT_FAILED_TEXT,
  CONTACT_US,
} from "@appsmith/constants/messages";
import { Banner } from "design-system";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import {
  CUSTOMER_PORTAL_PLANS_URL,
  SALES_TEAM_EMAIL,
} from "@appsmith/constants/BillingConstants";

const MAIL_TO_SALES = `mailto:${SALES_TEAM_EMAIL}`;

const StyledBanner = styled(Banner)`
  position: fixed;
  z-index: 2;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
`;

export function PageBannerMessage(): any {
  const isAdmin = useSelector(isAdminUser);
  const isTrialExpired = useSelector(isTrialExpiredLicense);
  const isTrialActive = useSelector(isTrialActiveLicense);
  const isPaidExpired = useSelector(isPaidExpiredLicense);
  const isPaymentFailed = useSelector(isLicensePaymentFailed);
  const { days: gracePeriod, suffix } = useSelector(getRemainingDays);
  const isAirgappedInstance = isAirgapped();

  const getBannerLink = () => {
    if (isAirgappedInstance) return {};
    if (isAdmin) {
      if (isPaidExpired) {
        return {
          children: createMessage(CONTACT_US),
          to: MAIL_TO_SALES,
        };
      }
      return {
        children: createMessage(VISIT_PORTAL_CTA),
        to: CUSTOMER_PORTAL_PLANS_URL,
      };
    }
    return {};
  };

  function getBannerMessage() {
    if (isTrialActive) {
      const messageSuffix = isAdmin
        ? `${createMessage(CONTINUE_USING_FEATURES)}`
        : createMessage(NON_ADMIN_USER_TRIAL_EXPIRTY_WARNING);
      return `${createMessage(() =>
        TRIAL_EXPIRY_WARNING(gracePeriod, suffix),
      )} ${messageSuffix}`;
    }
    if (isAdmin) {
      if (isTrialExpired) {
        return createMessage(TRIAL_EXPIRED_TEXT);
      } else if (isPaidExpired) {
        return createMessage(PAID_EXPIRED_TEXT);
      } else if (isPaymentFailed) {
        return createMessage(() => PAYMENT_FAILED_TEXT(gracePeriod, suffix));
      }
    }
    return null;
  }

  if (!!getBannerMessage()) {
    return (
      <StyledBanner
        data-testid="t--billing-banner"
        kind={isPaymentFailed ? "error" : "warning"}
        link={{ ...getBannerLink() }}
      >
        {getBannerMessage()}
      </StyledBanner>
    );
  }
  return null;
}

export default PageBannerMessage;
