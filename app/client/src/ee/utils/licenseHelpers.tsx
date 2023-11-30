export * from "ce/utils/licenseHelpers";
import React from "react";
import { useSelector } from "react-redux";
import {
  isAdminUser,
  isFreePlan,
  isTrialLicense,
  shouldShowLicenseBanner,
} from "@appsmith/selectors/tenantSelectors";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import store from "store";
import { customerPortalPlansUrl } from "@appsmith/utils/billingUtils";
import { createMessage, UPGRADE } from "@appsmith/constants/messages";
import { useRouteMatch } from "react-router";
import PageBannerMessage from "@appsmith/pages/common/PageWrapperBanner";
import { Button } from "design-system";

export const getLicenseKey = () => {
  const state = store.getState();
  const licenseKey = state?.tenant?.tenantConfiguration?.license?.key;
  return licenseKey || "";
};

export const pricingPageUrlSource = "BE";

export const ShowUpgradeMenuItem = () => {
  const isTrial = useSelector(isTrialLicense);
  const isAdmin = useSelector(isAdminUser);
  const isFree = useSelector(isFreePlan);
  const isAirgappedInstance = isAirgapped();
  return (isTrial || isFree) && isAdmin && !isAirgappedInstance ? (
    <Button
      className="business-plan-menu-option mr-2"
      data-testid="t--upgrade-to-business"
      href={customerPortalPlansUrl}
      kind="secondary"
      target="_blank"
    >
      {createMessage(UPGRADE)}
    </Button>
  ) : null;
};

export const Banner = () => {
  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;
  const isLicensePage = useRouteMatch("/license")?.isExact;
  return showBanner && (isHomePage || isLicensePage) ? (
    <PageBannerMessage />
  ) : null;
};
