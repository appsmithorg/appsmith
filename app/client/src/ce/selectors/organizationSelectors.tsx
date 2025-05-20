import type { DefaultRootState } from "react-redux";

/**
 * selects the organization permissions
 *
 * @param state
 * @returns
 */
export const getOrganizationPermissions = (state: DefaultRootState) => {
  return state.organization?.userPermissions;
};

/**
 * selects the organization config
 *
 * @param state
 * @returns
 */
export const getOrganizationConfig = (state: DefaultRootState) => {
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

export const isOrganizationLoading = (state: DefaultRootState) => {
  return state.organization?.isLoading;
};

export const getGoogleMapsApiKey = (
  state: DefaultRootState,
): string | undefined =>
  state.organization?.organizationConfiguration?.googleMapsKey as
    | string
    | undefined;

export const getThirdPartyAuths = (state: DefaultRootState): string[] =>
  state.organization?.organizationConfiguration?.thirdPartyAuths ?? [];

export const getIsFormLoginEnabled = (state: DefaultRootState): boolean =>
  state.organization?.organizationConfiguration?.isFormLoginEnabled ?? true;

export const getIsSignupDisabled = (state: DefaultRootState): boolean =>
  state.organization?.organizationConfiguration?.isSignupDisabled ?? false;

export const getInstanceId = (state: DefaultRootState): string =>
  state.organization?.instanceId;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const shouldShowLicenseBanner = (state: DefaultRootState) => false;

export const getHideWatermark = (state: DefaultRootState): boolean =>
  state.organization?.organizationConfiguration?.hideWatermark;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isFreePlan = (state: DefaultRootState) => true;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isWithinAnOrganization = (state: DefaultRootState) => true;
