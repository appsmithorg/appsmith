export * from "ce/api/TenantApi";
import { TenantApi as CE_TenantApi } from "ce/api/TenantApi";

export class TenantApi extends CE_TenantApi {
  static validateLicense(licenseKey: string) {
    if (licenseKey) {
      return TenantApi.put("v1/tenants/license", { key: licenseKey });
    }
  }
}

export default TenantApi;
