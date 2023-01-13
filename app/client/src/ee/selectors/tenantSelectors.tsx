export * from "ce/selectors/tenantSelectors";
import { AppState } from "@appsmith/reducers";
import { selectFeatureFlags } from "selectors/usersSelectors";

export const isValidLicense = (state: AppState) => {
  return state.tenant?.tenantConfiguration?.license?.active;
};

export const getLicenseType = (state: AppState) => {
  return state.tenant?.tenantConfiguration?.license?.type;
};

export const getLicenseExpiry = (state: AppState) => {
  return state.tenant?.tenantConfiguration?.license?.expiry;
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
  const expiryDate = new Date(
    false ? state.tenant?.tenantConfiguration?.license?.expiry : "20 Jan 2023",
  );
  const diffTime = Math.abs(expiryDate.getTime() - presentDate.getTime());
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
