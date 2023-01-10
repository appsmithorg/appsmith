import { AppState } from "@appsmith/reducers";
import localStorage from "utils/localStorage";
import { createBrandColorsFromPrimaryColor } from "utils/BrandingUtils";

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
    brandColors: {
      ...createBrandColorsFromPrimaryColor("#000"),
    },
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
