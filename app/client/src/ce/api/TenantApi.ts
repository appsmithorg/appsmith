import type { AxiosPromise } from "axios";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";

export type FetchCurrentTenantConfigResponse = ApiResponse<{
  userPermissions: string[];
  tenantConfiguration: Record<string, string>;
  new: boolean;
}>;

export type UpdateTenantConfigResponse = ApiResponse<{
  tenantConfiguration: Record<string, string>;
}>;

export type UpdateTenantConfigRequest = {
  tenantConfiguration: Record<string, string>;
  isOnlyTenantSettings: boolean;
};

export class TenantApi extends Api {
  static tenantsUrl = "v1/tenants";

  static fetchCurrentTenantConfig(): AxiosPromise<FetchCurrentTenantConfigResponse> {
    return Api.get(`${TenantApi.tenantsUrl}/current`);
  }

  static updateTenantConfig(
    request: UpdateTenantConfigRequest,
  ): AxiosPromise<UpdateTenantConfigResponse> {
    return Api.put(`${TenantApi.tenantsUrl}`, request.tenantConfiguration);
  }
}

export default TenantApi;
