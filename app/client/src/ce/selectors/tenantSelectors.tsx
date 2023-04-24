import type { AppState } from "@appsmith/reducers";

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

export const getInstanceId = (state: AppState): string =>
  state.tenant?.instanceId;
