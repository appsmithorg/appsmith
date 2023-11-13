export * from "ce/selectors/tenantSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";
import {
  LICENSE_PLAN,
  LICENSE_PLANS,
  LICENSE_TYPE,
  PRODUCT_EDITION,
} from "@appsmith/pages/Billing/Types/types";

import type { AppState } from "@appsmith/reducers";
import { getRemainingDaysFromTimestamp } from "@appsmith/utils/billingUtils";
import { EE_PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";
import { createSelector } from "reselect";

const { cloudHosting } = getAppsmithConfigs();

export const isValidLicense = (state: AppState) => {
  const tenantConfig = state.tenant?.tenantConfiguration;
  const isActivated = tenantConfig?.isActivated;
  if (isActivated) {
    if (tenantConfig?.license?.plan === LICENSE_PLANS.FREE) {
      return true;
    }
    if (
      tenantConfig?.license?.plan !== LICENSE_PLANS.FREE &&
      tenantConfig?.license?.active
    ) {
      return true;
    }
  }
  return false;
};

export const isLicenseExpired = (state: AppState) => {
  const tenantConfig = state.tenant?.tenantConfiguration;
  const isActivated = tenantConfig?.isActivated;
  if (isActivated) {
    if (
      tenantConfig?.license &&
      tenantConfig?.license?.active === false &&
      tenantConfig?.license?.status === LICENSE_TYPE.EXPIRED
    ) {
      return true;
    }
  }
  return false;
};

export const getLicenseType = (state: AppState) => {
  return state.tenant?.tenantConfiguration?.license?.type;
};

export const getLicenseExpiry = (state: AppState) => {
  const date = new Date(
    state.tenant?.tenantConfiguration?.license?.expiry * 1000,
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return date;
};

export const getLicenseKey = (state: AppState) => {
  return state.tenant?.tenantConfiguration?.license?.key;
};

export const getLicenseId = (state: AppState) => {
  return state.tenant?.tenantConfiguration?.license?.id;
};

export const getLicenseDetails = (state: AppState) => {
  return state.tenant?.tenantConfiguration?.license;
};

export const getExpiry = (state: AppState) => {
  return state.tenant?.tenantConfiguration?.license?.expiry;
};

export const getRemainingDays = createSelector(getExpiry, (expiry) => {
  const timeStamp = expiry * 1000;
  return getRemainingDaysFromTimestamp(timeStamp);
});

export const isTrialLicense = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.type === LICENSE_TYPE.TRIAL;

export const isTrialExpiredLicense = (state: AppState) => {
  const { license } = state.tenant?.tenantConfiguration;
  if (license) {
    return (
      license.type === LICENSE_TYPE.TRIAL &&
      license.status === LICENSE_TYPE.EXPIRED
    );
  }
};

export const isTrialActiveLicense = (state: AppState) => {
  const { license } = state.tenant?.tenantConfiguration;
  if (license) {
    return (
      license.type === LICENSE_TYPE.TRIAL &&
      license.status !== LICENSE_TYPE.EXPIRED
    );
  }
};

export const isPaidExpiredLicense = (state: AppState) => {
  const { license } = state.tenant?.tenantConfiguration;
  if (license) {
    return (
      license.type === LICENSE_TYPE.PAID &&
      license.status === LICENSE_TYPE.EXPIRED
    );
  }
};

export const isLicensePaymentFailed = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.status ===
  LICENSE_TYPE.PAYMENT_FAILED;

export const shouldShowLicenseBanner = (state: AppState) => {
  if (
    isTrialActiveLicense(state) ||
    (isAdminUser(state) &&
      (isTrialExpiredLicense(state) ||
        isPaidExpiredLicense(state) ||
        isLicensePaymentFailed(state)))
  ) {
    return true;
  }
  return false;
};

export const hasInvalidLicenseKeyError = (state: AppState) => {
  return state.tenant.tenantConfiguration?.license?.invalidLicenseKeyError;
};

export const isAdminUser = (state: AppState) =>
  state.tenant?.userPermissions?.includes(EE_PERMISSION_TYPE.MANAGE_TENANTS);

export const isLicenseValidating = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.validatingLicense;

export const isLicenseUpdatingFree = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.isFree;

export const isRemovingLicense = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.removingLicense;

export const isLicenseRefreshing = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.refreshingLicense;

export const getLicensePlan = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.plan;

export const getProductEdition = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.productEdition;

export const isLicenseModalOpen = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.showLicenseModal;

export const isRemoveLicenseModalOpen = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.showRemoveLicenseModal;

export const isDowngradeLicenseModalOpen = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.showDowngradeLicenseModal;

export const isEnterprise = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.plan ===
    LICENSE_PLAN.ENTERPRISE &&
  state.tenant?.tenantConfiguration?.license?.productEdition ===
    PRODUCT_EDITION.COMMERCIAL;

export const isAirgapLicense = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.plan ===
    LICENSE_PLAN.ENTERPRISE &&
  state.tenant?.tenantConfiguration?.license?.productEdition ===
    PRODUCT_EDITION.AIR_GAP;

export const getStartDate = (state: AppState) => {
  const date =
    state.tenant?.tenantConfiguration?.license?.subscriptionDetails?.startDate;
  if (!date) return date;
  const parsedDate = new Date(date * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return parsedDate;
};

export const getEndDate = (state: AppState) => {
  const date =
    state.tenant?.tenantConfiguration?.license?.subscriptionDetails?.startDate;
  if (!date) return date;
  const parsedDate = new Date(
    state.tenant?.tenantConfiguration?.license?.subscriptionDetails?.endDate *
      1000,
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return parsedDate;
};

export const getCustomerEmail = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.subscriptionDetails
    ?.customerEmail;

/**
 * selects the tenant brand colors
 *
 * @returns
 */
export const getBrandColors = (state: AppState) => {
  if (!cloudHosting) {
    return state.tenant?.tenantConfiguration?.brandColors || {};
  }

  return {};
};

export const isFreePlan = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.plan === LICENSE_PLANS.FREE;

export const isTenantActivated = (state: AppState) =>
  state.tenant?.tenantConfiguration?.isActivated;
