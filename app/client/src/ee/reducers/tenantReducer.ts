export * from "ce/reducers/tenantReducer";
import {
  TenantReduxState,
  handlers as CE_Handlers,
  initialState as CE_InitialState,
} from "ce/reducers/tenantReducer";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";
import {
  cachedTenantConfigParsed,
  createBrandColorsFromPrimaryColor,
} from "utils/BrandingUtils";

export interface License {
  active: boolean;
  key: string;
  type: string;
  id: string;
  status: string;
  expiry: number;
  showBEBanner: boolean;
  closedBannerAlready: boolean;
  invalidLicenseKeyError: boolean;
  validatingLicense: boolean;
  origin?: string;
  showLicenseModal: boolean;
}

const INITIAL_BRAND_COLOR = "#000";

export const initialState: TenantReduxState<any> = {
  ...CE_InitialState,
  tenantConfiguration: {
    ...CE_InitialState.tenantConfiguration,
    brandColors: {
      ...createBrandColorsFromPrimaryColor(INITIAL_BRAND_COLOR),
    },
    ...cachedTenantConfigParsed,
    license: {
      validatingLicense: false,
    },
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
      ...state.tenantConfiguration,
      ...action.payload.tenantConfiguration,
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
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        validatingLicense: true,
      },
    },
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
        validatingLicense: false,
      },
    },
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
        validatingLicense: false,
      },
    },
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
  }),
  [ReduxActionTypes.SHOW_LICENSE_MODAL]: (
    state: TenantReduxState<License>,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        showLicenseModal: action.payload,
        invalidLicenseKeyError: !action.payload && false,
      },
    },
  }),
  [ReduxActionTypes.FORCE_LICENSE_CHECK_INIT]: (
    state: TenantReduxState<License>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        validatingLicense: true,
      },
    },
  }),
  [ReduxActionTypes.FORCE_LICENSE_CHECK_SUCCESS]: (
    state: TenantReduxState<License>,
    action: ReduxAction<TenantReduxState<License>>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        ...action.payload.tenantConfiguration?.license,
        validatingLicense: false,
      },
    },
  }),
  [ReduxActionErrorTypes.FORCE_LICENSE_CHECK_ERROR]: (
    state: TenantReduxState<License>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        validatingLicense: false,
      },
    },
  }),
};

export default createReducer(initialState, handlers);
