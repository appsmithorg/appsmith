import {
  APPSMITH_BRAND_LOGO_URL,
  APPSMITH_BRAND_FAVICON_URL,
  APPSMITH_BRAND_PRIMARY_COLOR,
  createBrandColorsFromPrimaryColor,
} from "utils/BrandingUtils";
import { AppState } from "@appsmith/reducers";
import localStorage from "utils/localStorage";

const defaultBrandingConfig = {
  brandFaviconUrl: APPSMITH_BRAND_FAVICON_URL,
  brandColors: {
    ...createBrandColorsFromPrimaryColor(APPSMITH_BRAND_PRIMARY_COLOR),
  },
  brandLogoUrl: APPSMITH_BRAND_LOGO_URL,
};

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
  const cachedTenantConfig = localStorage.getItem("tenantConfig");
  let cachedTenantConfigParsed = {
    ...defaultBrandingConfig,
  };

  try {
    if (cachedTenantConfig) {
      cachedTenantConfigParsed = JSON.parse(cachedTenantConfig);
    }
  } catch (e) {}

  return {
    ...cachedTenantConfigParsed,
    ...(state.tenant?.tenantConfiguration || {}),
  } as Record<string, any>;
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
