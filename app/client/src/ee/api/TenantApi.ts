export * from "ce/api/TenantApi";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";
import { TenantApi as CE_TenantApi } from "ce/api/TenantApi";

export class TenantApi extends CE_TenantApi {
  static async forceCheckLicense(): Promise<AxiosPromise<ApiResponse>> {
    return TenantApi.get("v1/tenants/license");
  }
  static async validateLicense(
    licenseKey: string,
  ): Promise<AxiosPromise<ApiResponse>> {
    return TenantApi.put("v1/tenants/license", { key: licenseKey });
  }
  static async validateLicenseForOnboarding(
    licenseKey: string,
  ): Promise<AxiosPromise<ApiResponse>> {
    return TenantApi.post("v1/tenants/license", { key: licenseKey });
  }
  static async removeLicense(): Promise<AxiosPromise<ApiResponse>> {
    return TenantApi.delete("v1/tenants/license");
  }
  static async validateLicenseDryRun(
    licenseKey: string,
  ): Promise<AxiosPromise<ApiResponse>> {
    return TenantApi.put("v1/tenants/license", {
      key: licenseKey,
      isDryRun: true,
    });
  }
}

export default TenantApi;
