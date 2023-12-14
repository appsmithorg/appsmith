import type { AxiosPromise, AxiosRequestConfig } from "axios";

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

export interface UpdateTenantConfigRequest {
  tenantConfiguration: Record<string, string>;
  needsRefresh?: boolean;
  isOnlyTenantSettings?: boolean;
  apiConfig?: AxiosRequestConfig;
}

export class TenantApi extends Api {
  static tenantsUrl = "v1/tenants";

  static async fetchCurrentTenantConfig(): Promise<
    AxiosPromise<FetchCurrentTenantConfigResponse>
  > {
    // /v1/tenants/current
    return {
      responseMeta: {
        status: 200,
        success: true,
      },
      data: {
        userPermissions: ["manage:tenants"],
        instanceId: "657ad3ece4a5e56691a2f83a",
        tenantConfiguration: {
          isFormLoginEnabled: true,
          instanceName: "Appsmith",
          license: {
            plan: "FREE",
          },
          emailVerificationEnabled: false,
          thirdPartyAuths: null,
          migrationStatus: "COMPLETED",
          featuresWithPendingMigration: {},
        },
        new: true,
      },
      errorDisplay: "",
    } as any;
  }

  static async updateTenantConfig(
    request: UpdateTenantConfigRequest,
  ): Promise<AxiosPromise<UpdateTenantConfigResponse>> {
    return Api.put(
      `${TenantApi.tenantsUrl}`,
      request.tenantConfiguration,
      null,
      {
        ...(request.apiConfig || {}),
      },
    );
  }
}

export default TenantApi;
