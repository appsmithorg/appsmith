export * from "ce/api/TenantApi";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";
import { TenantApi as CE_TenantApi } from "ce/api/TenantApi";

export class TenantApi extends CE_TenantApi {
  static forceCheckLicense(): AxiosPromise<ApiResponse> {
    return TenantApi.get("v1/tenants/license");
  }
  static validateLicense(licenseKey: string): AxiosPromise<ApiResponse> {
    return TenantApi.put("v1/tenants/license", { key: licenseKey });
  }
  static validateLicenseForOnboarding(
    licenseKey: string,
  ): AxiosPromise<ApiResponse> {
    return TenantApi.post("v1/tenants/license", { key: licenseKey });
  }
}

export default TenantApi;
