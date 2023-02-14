export * from "ce/selectors/tenantSelectors";
import { Status } from "@appsmith/pages/Billing/StatusBadge";
import { AppState } from "@appsmith/reducers";
import { EE_PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";
import { createSelector } from "reselect";
import { selectFeatureFlags } from "selectors/usersSelectors";

export const isValidLicense = (state: AppState) => {
  return state.tenant?.tenantConfiguration?.license?.active;
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
  const totalHours = Math.floor(
    (new Date(timeStamp).getTime() - Date.now()) / (1000 * 60 * 60),
  );
  if (totalHours <= 720 && totalHours > 708) {
    return {
      days: 30,
      suffix: "days",
    };
  }
  if (totalHours <= 12) {
    return {
      days: totalHours,
      suffix: totalHours > 1 ? "hours" : "hour",
    };
  }
  const days = Math.floor((totalHours - 12) / 24) + 1;
  return {
    days,
    suffix: days > 1 ? "days" : "day",
  };
});

export const isTrialLicense = (state: AppState) => {
  return state.tenant?.tenantConfiguration?.license?.type === "TRIAL";
};

export const isBEBannerVisible = (state: AppState) => {
  const featureFlags = selectFeatureFlags(state);
  return featureFlags.USAGE_AND_BILLING
    ? state.tenant?.tenantConfiguration?.license?.showBEBanner &&
        !state.tenant?.tenantConfiguration?.license?.closedBannerAlready
    : false;
};

export const shouldShowLicenseBanner = (state: AppState) => {
  const trialLicense = isTrialLicense(state);
  const isBEBanner = isBEBannerVisible(state);
  const featureFlags = selectFeatureFlags(state);
  return featureFlags.USAGE_AND_BILLING ? !isBEBanner && trialLicense : false;
};

export const hasInvalidLicenseKeyError = (state: AppState) => {
  return state.tenant.tenantConfiguration?.license?.invalidLicenseKeyError;
};

export const getLicenseStatus = (state: AppState) => {
  const isLicenseValid = isValidLicense(state);
  const isTrial = isTrialLicense(state);

  if (isLicenseValid) {
    if (isTrial) {
      return Status.TRIAL;
    } else {
      return Status.ACTIVE;
    }
  } else {
    return Status.INACTIVE;
  }
};

export const isAdminUser = (state: AppState) =>
  state.tenant?.userPermissions?.includes(EE_PERMISSION_TYPE.MANAGE_TENANTS);

export const isLicenseValidating = (state: AppState) =>
  state.tenant?.tenantConfiguration?.license?.validatingLicense;
