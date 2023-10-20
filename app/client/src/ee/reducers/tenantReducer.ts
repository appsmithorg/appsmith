export * from "ce/reducers/tenantReducer";
import type { TenantReduxState } from "ce/reducers/tenantReducer";
import {
  handlers as CE_Handlers,
  initialState as CE_InitialState,
  defaultBrandingConfig,
} from "ce/reducers/tenantReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";
import {
  cachedTenantConfigParsed,
  createBrandColorsFromPrimaryColor,
} from "utils/BrandingUtils";
import type { LICENSE_MODIFICATION } from "@appsmith/pages/Billing/Types/types";

export interface License {
  changeType: LICENSE_MODIFICATION;
  active: boolean;
  key: string;
  type: string;
  id: string;
  status: string;
  expiry: number;
  invalidLicenseKeyError: boolean;
  validatingLicense: boolean;
  origin?: string;
  showLicenseModal: boolean;
  showRemoveLicenseModal: boolean;
  removingLicense: boolean;
  showDowngradeLicenseModal: boolean;
  updatingLicense: boolean;
  refreshingLicense: boolean;
  isFree?: boolean;
  plan?: string;
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
      ...state.tenantConfiguration,
      ...action.payload.tenantConfiguration,
      brandColors: {
        ...defaultBrandingConfig.brandColors,
        ...action.payload.tenantConfiguration.brandColors,
      },
      license: {
        ...state.tenantConfiguration?.license,
        ...action.payload.tenantConfiguration?.license,
      },
    },
    isLoading: false,
    instanceId: action.payload.instanceId || state.instanceId || "",
  }),
  [ReduxActionTypes.VALIDATE_LICENSE_KEY]: (
    state: TenantReduxState<License>,
    action: ReduxAction<{ key: string; isUserOnboarding: boolean }>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        validatingLicense: true,
        isFree: action.payload?.key === "",
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
        ...state.tenantConfiguration?.license,
        ...action.payload.tenantConfiguration?.license,
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
        refreshingLicense: true,
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
        refreshingLicense: false,
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
        refreshingLicense: false,
      },
    },
  }),
  [ReduxActionTypes.SHOW_REMOVE_LICENSE_MODAL]: (
    state: TenantReduxState<License>,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        showRemoveLicenseModal: action.payload,
      },
    },
  }),
  [ReduxActionTypes.REMOVE_LICENSE_INIT]: (
    state: TenantReduxState<License>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        removingLicense: true,
      },
    },
  }),
  [ReduxActionTypes.REMOVE_LICENSE_SUCCESS]: (
    state: TenantReduxState<License>,
    action: ReduxAction<TenantReduxState<License>>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        ...action.payload.tenantConfiguration?.license,
        removingLicense: false,
      },
    },
  }),
  [ReduxActionErrorTypes.REMOVE_LICENSE_ERROR]: (
    state: TenantReduxState<License>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        removingLicense: false,
      },
    },
  }),
  [ReduxActionTypes.VALIDATE_LICENSE_KEY_DRY_RUN_INIT]: (
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
  [ReduxActionTypes.VALIDATE_LICENSE_KEY_DRY_RUN_SUCCESS]: (
    state: TenantReduxState<License>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration?.license,
        validatingLicense: false,
      },
    },
  }),
  [ReduxActionErrorTypes.VALIDATE_LICENSE_KEY_DRY_RUN_ERROR]: (
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
  [ReduxActionTypes.SHOW_DOWNGRADE_LICENSE_MODAL]: (
    state: TenantReduxState<License>,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    tenantConfiguration: {
      ...state.tenantConfiguration,
      license: {
        ...state.tenantConfiguration.license,
        showDowngradeLicenseModal: action.payload,
      },
    },
  }),
};

export default createReducer(initialState, handlers);
