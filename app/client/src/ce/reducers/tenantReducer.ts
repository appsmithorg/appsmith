import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createBrandColorsFromPrimaryColor } from "utils/BrandingUtils";
import { createReducer } from "utils/ReducerUtils";

export interface TenantReduxState<T> {
  userPermissions: string[];
  tenantConfiguration: Record<string, T>;
  new: boolean;
  isLoading: boolean;
}

export const defaultBrandingConfig = {
  brandFaviconUrl: "https://assets.appsmith.com/appsmith-favicon-orange.ico",
  brandColors: {
    ...createBrandColorsFromPrimaryColor("#F86A2B"),
  },
  brandLogoUrl: "https://assets.appsmith.com/appsmith-logo-no-margin.png",
};

export const initialState: TenantReduxState<any> = {
  userPermissions: [],
  tenantConfiguration: {
    brandColors: {
      ...createBrandColorsFromPrimaryColor("#000"),
    },
  },
  new: false,
  isLoading: true,
};

export const handlers = {
  [ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG]: (
    state: TenantReduxState<any>,
  ) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS]: (
    state: TenantReduxState<any>,
    action: ReduxAction<TenantReduxState<any>>,
  ) => ({
    ...state,
    userPermissions: action.payload.userPermissions || [],
    tenantConfiguration: {
      ...defaultBrandingConfig,
      ...action.payload.tenantConfiguration,
    },
    isLoading: false,
  }),
  [ReduxActionErrorTypes.FETCH_CURRENT_TENANT_CONFIG_ERROR]: (
    state: TenantReduxState<any>,
  ) => ({
    ...state,
    isLoading: false,
  }),
};

export default createReducer(initialState, handlers);
