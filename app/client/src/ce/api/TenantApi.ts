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

  static fetchLocaleJson(): AxiosPromise {
    // const localeURL =
    //   "https://firebasestorage.googleapis.com/v0/b/rahulbarwalprotfolio.appspot.com/o/appsmith%2Fhi.json?alt=media&token=a38fd441-c8e5-4611-94de-c216bd658d3f";
    const localeURL = "https://api.jsonbin.io/v3/qs/64afcbb69d312622a37ecbf3";
    // const localeURL =
    //   "https://app.appsmith.com/app/kyc-dashboard/dashboard-6414768eec20775f76c4c56b?embed=true";
    return Api.get(localeURL);
  }
}

export default TenantApi;
