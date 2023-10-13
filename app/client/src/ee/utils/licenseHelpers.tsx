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
import capitalize from "lodash/capitalize";
import { createMessage, UPGRADE } from "@appsmith/constants/messages";
import { useRouteMatch } from "react-router";
import PageBannerMessage from "@appsmith/pages/common/PageWrapperBanner";
import { Link } from "design-system";
import styled from "styled-components";

export const getLicenseKey = () => {
  const state = store.getState();
  const licenseKey = state?.tenant?.tenantConfiguration?.license?.key;
  return licenseKey || "";
};

const StyledLink = styled(Link)`
  align-items: center;
  height: 38px;
  gap: 8px;
  padding: 14px;
`;

export const pricingPageUrlSource = "BE";

export const ShowUpgradeMenuItem = () => {
  const isTrial = useSelector(isTrialLicense);
  const isAdmin = useSelector(isAdminUser);
  const isFree = useSelector(isFreePlan);
  const isAirgappedInstance = isAirgapped();
  return (isTrial || isFree) && isAdmin && !isAirgappedInstance ? (
    <StyledLink
      className="business-plan-menu-option"
      data-testid="t--upgrade-to-business"
      kind="primary"
      startIcon="upload-cloud"
      target="_blank"
      to={customerPortalPlansUrl}
    >
      {capitalize(createMessage(UPGRADE))}
    </StyledLink>
  ) : null;
};

export const Banner = () => {
  const showBanner = useSelector(shouldShowLicenseBanner);
  const isHomePage = useRouteMatch("/applications")?.isExact;
  return showBanner && isHomePage ? <PageBannerMessage /> : null;
};
