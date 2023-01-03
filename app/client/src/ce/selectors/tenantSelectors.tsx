import { AppState } from "@appsmith/reducers";

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
