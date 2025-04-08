import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import {
  APPSMITH_BRAND_FAVICON_URL,
  APPSMITH_BRAND_LOGO_URL,
  APPSMITH_BRAND_PRIMARY_COLOR,
  createBrandColorsFromPrimaryColor,
} from "utils/BrandingUtils";
import { createReducer } from "utils/ReducerUtils";

export interface OrganizationReduxState<T> {
  userPermissions: string[];
  organizationConfiguration: Record<string, T>;
  new: boolean;
  isLoading: boolean;
  instanceId: string;
  tenantId: string;
  isWithinAnOrganization: boolean;
}

export const defaultBrandingConfig = {
  brandFaviconUrl: APPSMITH_BRAND_FAVICON_URL,
  brandColors: {
    ...createBrandColorsFromPrimaryColor(APPSMITH_BRAND_PRIMARY_COLOR),
  },
  brandLogoUrl: APPSMITH_BRAND_LOGO_URL,
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initialState: OrganizationReduxState<any> = {
  userPermissions: [],
  organizationConfiguration: {
    ...defaultBrandingConfig,
  },
  new: false,
  isLoading: true,
  instanceId: "",
  tenantId: "",
  isWithinAnOrganization: false,
};

export const handlers = {
  [ReduxActionTypes.FETCH_CURRENT_ORGANIZATION_CONFIG]: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: OrganizationReduxState<any>,
    action: ReduxAction<{ isBackgroundRequest: boolean }>,
  ) => ({
    ...state,
    isLoading: !action.payload.isBackgroundRequest,
  }),
  [ReduxActionTypes.FETCH_CURRENT_ORGANIZATION_CONFIG_SUCCESS]: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: OrganizationReduxState<any>,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<OrganizationReduxState<any>>,
  ) => ({
    ...state,
    userPermissions: action.payload.userPermissions || [],
    organizationConfiguration: {
      ...defaultBrandingConfig,
      ...state.organizationConfiguration,
      ...action.payload.organizationConfiguration,
      brandColors: {
        ...defaultBrandingConfig.brandColors,
        ...action.payload.organizationConfiguration.brandColors,
      },
    },
    isLoading: false,
    instanceId: action.payload.instanceId,
    tenantId: action.payload.tenantId,
    isWithinAnOrganization: action.payload.isWithinAnOrganization,
  }),
  [ReduxActionErrorTypes.FETCH_CURRENT_ORGANIZATION_CONFIG_ERROR]: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: OrganizationReduxState<any>,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_ORGANIZATION_CONFIG_SUCCESS]: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: OrganizationReduxState<any>,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<OrganizationReduxState<any>>,
  ) => ({
    ...state,
    ...action.payload,
    organizationConfiguration: {
      ...state.organizationConfiguration,
      ...action.payload.organizationConfiguration,
    },
    isLoading: false,
  }),
  [ReduxActionErrorTypes.UPDATE_ORGANIZATION_CONFIG_ERROR]: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: OrganizationReduxState<any>,
  ) => ({
    ...state,
    isLoading: false,
  }),
};

export default createReducer(initialState, handlers);
