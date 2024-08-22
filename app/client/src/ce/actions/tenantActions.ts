import type { ApiResponse } from "api/ApiResponses";
import type { UpdateTenantConfigRequest } from "ee/api/TenantApi";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export const getCurrentTenant = (
  isBackgroundRequest = true,
  tenantConfig?: ApiResponse,
) => ({
  type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
  payload: {
    isBackgroundRequest,
    tenantConfig,
  },
});

export const updateTenantConfig = (payload: UpdateTenantConfigRequest) => ({
  type: ReduxActionTypes.UPDATE_TENANT_CONFIG,
  payload,
});
