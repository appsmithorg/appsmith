import type { AppState } from "ee/reducers";

/**
 * selects the organization permissions
 *
 * @param state
 * @returns
 */
export const getOrganizationPermissions = (state: AppState) => {
  return state.organization?.userPermissions;
};

/**
 * selects the organization config
 *
 * @param state
 * @returns
 */
export const getOrganizationConfig = (state: AppState) => {
  return state.organization?.organizationConfiguration;
};

/**
 * selects the organization brand colors
 *
 * @returns
 */
export const getBrandColors = () => {
  return {} as Record<string, string>;
};

export const isValidLicense = () => {
  return true;
};

export const isOrganizationLoading = (state: AppState) => {
  return state.organization?.isLoading;
};

export const getGoogleMapsApiKey = (state: AppState): string | undefined =>
  state.organization?.organizationConfiguration?.googleMapsKey as
    | string
    | undefined;

export const getThirdPartyAuths = (state: AppState): string[] =>
  state.organization?.organizationConfiguration?.thirdPartyAuths ?? [];

export const getIsFormLoginEnabled = (state: AppState): boolean =>
  state.organization?.organizationConfiguration?.isFormLoginEnabled ?? true;

export const getIsSignupDisabled = (state: AppState): boolean =>
  state.organization?.organizationConfiguration?.isSignupDisabled ?? false;

export const getInstanceId = (state: AppState): string =>
  state.organization?.instanceId;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const shouldShowLicenseBanner = (state: AppState) => false;

export const getHideWatermark = (state: AppState): boolean =>
  state.organization?.organizationConfiguration?.hideWatermark;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isFreePlan = (state: AppState) => true;
