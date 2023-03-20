import type { AxiosPromise } from "axios";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";

export type FetchCurrentTenantConfigResponse = ApiResponse<{
  userPermissions: string[];
  tenantConfiguration: Record<string, string>;
  new: boolean;
}>;

export class TenantApi extends Api {
  static tenantsUrl = "v1/tenants";

  static fetchCurrentTenantConfig(): AxiosPromise<FetchCurrentTenantConfigResponse> {
    return Api.get(TenantApi.tenantsUrl + "/current");
  }
}

export default TenantApi;
