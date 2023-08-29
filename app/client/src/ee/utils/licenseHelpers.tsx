export * from "ce/utils/licenseHelpers";
import React from "react";
import { useSelector } from "react-redux";
import { MenuItem } from "design-system-old";
import {
  isAdminUser,
  isTrialLicense,
  shouldShowLicenseBanner,
} from "@appsmith/selectors/tenantSelectors";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import store from "store";
import { goToCustomerPortal } from "@appsmith/utils/billingUtils";
import capitalize from "lodash/capitalize";
import { createMessage, UPGRADE } from "@appsmith/constants/messages";
import { useRouteMatch } from "react-router";
import PageBannerMessage from "@appsmith/pages/common/PageWrapperBanner";

export const getLicenseKey = () => {
  const state = store.getState();
  const licenseKey = state?.tenant?.tenantConfiguration?.license?.key;
  return licenseKey || "";
};

export const pricingPageUrlSource = "BE";

export const ShowUpgradeMenuItem = () => {
  const isTrial = useSelector(isTrialLicense);
  const isAdmin = useSelector(isAdminUser);
  const isAirgappedInstance = isAirgapped();
  return isTrial && isAdmin && !isAirgappedInstance ? (
    <MenuItem
      className="business-plan-menu-option"
      data-testid="t--upgrade-to-business"
      icon="upload-cloud"
      onSelect={goToCustomerPortal}
      text={capitalize(createMessage(UPGRADE))}
    />
  ) : null;
};

export const Banner = () => {
  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;
  return showBanner && isHomePage ? <PageBannerMessage /> : null;
};
