import type { AppState } from "ee/reducers";

/**
 * selects the tenant permissions
 *
 * @param state
 * @returns
 */
export const getTenantPermissions = (state: AppState) => {
  return state.tenant?.userPermissions;
};

/**
 * selects the tenant config
 *
 * @param state
 * @returns
 */
export const getTenantConfig = (state: AppState) => {
  return state.tenant?.tenantConfiguration;
};

/**
 * selects the tenant brand colors
 *
 * @returns
 */
export const getBrandColors = () => {
  return {} as Record<string, string>;
};

export const isValidLicense = () => {
  return true;
};

export const isTenantLoading = (state: AppState) => {
  return state.tenant?.isLoading;
};

export const getGoogleMapsApiKey = (state: AppState): string | undefined =>
  state.tenant?.tenantConfiguration?.googleMapsKey as string | undefined;

export const getThirdPartyAuths = (state: AppState): string[] =>
  state.tenant?.tenantConfiguration?.thirdPartyAuths ?? [];

export const getIsFormLoginEnabled = (state: AppState): boolean =>
  state.tenant?.tenantConfiguration?.isFormLoginEnabled ?? true;

export const getInstanceId = (state: AppState): string =>
  state.tenant?.instanceId;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const shouldShowLicenseBanner = (state: AppState) => false;

export const getHideWatermark = (state: AppState): boolean =>
  state.tenant?.tenantConfiguration?.hideWatermark;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isFreePlan = (state: AppState) => true;
