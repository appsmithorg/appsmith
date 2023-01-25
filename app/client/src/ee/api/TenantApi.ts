export * from "ce/api/TenantApi";
import { ApiResponse } from "api/ApiResponses";
import { AxiosPromise } from "axios";
import { TenantApi as CE_TenantApi } from "ce/api/TenantApi";

export class TenantApi extends CE_TenantApi {
  static validateLicense(licenseKey: string): AxiosPromise<ApiResponse> {
    return TenantApi.put("v1/tenants/license", { key: licenseKey });
  }
}

export default TenantApi;
