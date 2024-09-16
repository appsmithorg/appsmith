import type { ReduxAction } from "ee/constants/ReduxActionConstants";
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

export interface TenantReduxState<T> {
  userPermissions: string[];
  tenantConfiguration: Record<string, T>;
  new: boolean;
  isLoading: boolean;
  instanceId: string;
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
export const initialState: TenantReduxState<any> = {
  userPermissions: [],
  tenantConfiguration: {
    ...defaultBrandingConfig,
  },
  new: false,
  isLoading: true,
  instanceId: "",
};

export const handlers = {
  [ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG]: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: TenantReduxState<any>,
    action: ReduxAction<{ isBackgroundRequest: boolean }>,
  ) => ({
    ...state,
    isLoading: !action.payload.isBackgroundRequest,
  }),
  [ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS]: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: TenantReduxState<any>,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<TenantReduxState<any>>,
  ) => ({
    ...state,
    userPermissions: action.payload.userPermissions || [],
    tenantConfiguration: {
      ...defaultBrandingConfig,
      ...state.tenantConfiguration,
      ...action.payload.tenantConfiguration,
      brandColors: {
        ...defaultBrandingConfig.brandColors,
        ...action.payload.tenantConfiguration.brandColors,
      },
    },
    isLoading: false,
    instanceId: action.payload.instanceId,
  }),
  [ReduxActionErrorTypes.FETCH_CURRENT_TENANT_CONFIG_ERROR]: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: TenantReduxState<any>,
  ) => ({
    ...state,
    isLoading: false,
  }),
  [ReduxActionTypes.UPDATE_TENANT_CONFIG_SUCCESS]: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: TenantReduxState<any>,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<TenantReduxState<any>>,
  ) => ({
    ...state,
    ...action.payload,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      ...action.payload.tenantConfiguration,
    },
    isLoading: false,
  }),
  [ReduxActionErrorTypes.UPDATE_TENANT_CONFIG_ERROR]: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: TenantReduxState<any>,
  ) => ({
    ...state,
    isLoading: false,
  }),
};

export default createReducer(initialState, handlers);
