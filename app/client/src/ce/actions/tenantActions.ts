import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { UpdateTenantConfigRequest } from "@appsmith/api/TenantApi";

export const getCurrentTenant = (isBackgroundRequest = true) => ({
  type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
  payload: {
    isBackgroundRequest,
  },
});

export const updateTenantConfig = (payload: UpdateTenantConfigRequest) => ({
  type: ReduxActionTypes.UPDATE_TENANT_CONFIG,
  payload,
});
