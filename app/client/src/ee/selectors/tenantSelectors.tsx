export * from "ce/selectors/tenantSelectors";
import { Status } from "@appsmith/pages/Billing/StatusBadge";
import { AppState } from "@appsmith/reducers";
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

export const getRemainingDays = (state: AppState) => {
  const presentDate = new Date();
  const expiryDate = getLicenseExpiry(state);

  const expiryTimeStamp = new Date(expiryDate).getTime();
  const presentTimeStamp = presentDate.getTime();

  const diffTime = Math.abs(expiryTimeStamp - presentTimeStamp);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

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
