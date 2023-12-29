import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { UpdateTenantConfigRequest } from "@appsmith/api/TenantApi";
import type { ApiResponse } from "api/ApiResponses";

export const getCurrentTenant = (
  isBackgroundRequest = true,
  v1TenantsCurrentResp?: ApiResponse,
) => ({
  type: ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG,
  payload: {
    isBackgroundRequest,
    v1TenantsCurrentResp,
  },
});

export const updateTenantConfig = (payload: UpdateTenantConfigRequest) => ({
  type: ReduxActionTypes.UPDATE_TENANT_CONFIG,
  payload,
});
