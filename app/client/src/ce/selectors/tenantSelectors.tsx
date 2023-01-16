import {
  APPSMITH_BRAND_LOGO_URL,
  APPSMITH_BRAND_FAVICON_URL,
  APPSMITH_BRAND_PRIMARY_COLOR,
  createBrandColorsFromPrimaryColor,
} from "utils/BrandingUtils";
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

export const isValidLicense = () => {
  return true;
};

export const isTenantLoading = (state: AppState) => {
  return state.tenant?.isLoading;
};
