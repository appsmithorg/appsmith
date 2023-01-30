export * from "ce/reducers/tenantReducer";
import {
  handlers as CE_Handlers,
  initialState as CE_InitialState,
  TenantReduxState,
  defaultBrandingConfig,
} from "ce/reducers/tenantReducer";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

export interface License {
  active: boolean;
  key: string;
  type: string;
  id: string;
  expiry: number;
  showBEBanner: boolean;
  closedBannerAlready: boolean;
  invalidLicenseKeyError: boolean;
}

export const initialState: TenantReduxState<any> = {
  ...CE_InitialState,
  tenantConfiguration: {
    ...CE_InitialState.tenantConfiguration,
    license: {},
  },
};

export const handlers = {
  ...CE_Handlers,
  [ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS]: (
    state: TenantReduxState<any>,
    action: ReduxAction<TenantReduxState<any>>,
  ) => ({
    ...state,
    userPermissions: action.payload.userPermissions || [],
    tenantConfiguration: {
      ...defaultBrandingConfig,
      ...action.payload?.tenantConfiguration,
      license: {
        ...action.payload.tenantConfiguration?.license,
        showBEBanner:
          action.payload.tenantConfiguration?.license?.type === "TRIAL",
        closedBannerAlready:
          state.tenantConfiguration.license?.closedBannerAlready ?? false,
      },
    },
    isLoading: false,
  }),
  [ReduxActionTypes.VALIDATE_LICENSE_KEY]: (
    state: TenantReduxState<License>,
  ) => ({
    ...state,
    isLoading: true,
  }),
  [ReduxActionTypes.VALIDATE_LICENSE_KEY_SUCCESS]: (
    state: TenantReduxState<License>,
    action: ReduxAction<TenantReduxState<License>>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...action.payload.tenantConfiguration?.license,
        showBEBanner:
          action.payload.tenantConfiguration?.license.type === "TRIAL"
            ? true
            : false,
        closedBannerAlready:
          state.tenantConfiguration.license?.closedBannerAlready ?? false,
        invalidLicenseKeyError: false,
      },
    },
    isLoading: false,
  }),
  [ReduxActionErrorTypes.VALIDATE_LICENSE_KEY_ERROR]: (
    state: TenantReduxState<License>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        invalidLicenseKeyError: true,
      },
    },
    isLoading: false,
  }),
  [ReduxActionTypes.STOP_LICENSE_STATUS_CHECK]: (
    state: TenantReduxState<License>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: initialState.tenantConfiguration.license,
    },
  }),
  [ReduxActionTypes.SET_SHOW_BILLING_BANNER]: (
    state: TenantReduxState<License>,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        showBEBanner: action.payload,
        closedBannerAlready: true,
      },
    },
    isLoading: false,
  }),
};

export default createReducer(initialState, handlers);
