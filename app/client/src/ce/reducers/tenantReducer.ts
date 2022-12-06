import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createBrandColorsFromPrimaryColor } from "utils/BrandingUtils";
import { createReducer } from "utils/ReducerUtils";

export interface TenantReduxState {
  userPermissions: string[];
  tenantConfiguration: Record<string, any>;
  new: boolean;
}

export const defaultBrandingConfig = {
  brandFaviconUrl:
    "https://res.cloudinary.com/dwpfockn8/image/upload/v1597920848/favicons/favicon-orange_pxfmdc.ico",
  brandColors: {
    ...createBrandColorsFromPrimaryColor("#F86A2B"),
  },
  brandLogoUrl:
    "https://global-uploads.webflow.com/61531b23c347e4fbd4a84209/61531b23c347e41e24a8423e_Logo.svg",
};

export const initialState: TenantReduxState = {
  userPermissions: [],
  tenantConfiguration: {
    brandColors: {
      ...createBrandColorsFromPrimaryColor("#000"),
    },
  },
  new: false,
};

export const handlers = {
  [ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS]: (
    state: TenantReduxState,
    action: ReduxAction<TenantReduxState>,
  ) => ({
    ...state,
    userPermissions: action.payload.userPermissions,
    tenantConfiguration: {
      ...defaultBrandingConfig,
      ...action.payload.tenantConfiguration,
    },
  }),
  [ReduxActionErrorTypes.FETCH_CURRENT_TENANT_CONFIG_ERROR]: (
    state: TenantReduxState,
  ) => ({
    ...state,
  }),
};

export default createReducer(initialState, handlers);
