import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { UpdateTenantConfigRequest } from "@appsmith/api/TenantApi";
import type { ApiResponse } from "api/ApiResponses";

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
