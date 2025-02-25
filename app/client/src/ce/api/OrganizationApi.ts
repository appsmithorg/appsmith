import type { AxiosPromise, AxiosRequestConfig } from "axios";

import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";

export type FetchCurrentOrganizationConfigResponse = ApiResponse<{
  userPermissions: string[];
  organizationConfiguration: Record<string, string>;
  new: boolean;
}>;

export type UpdateOrganizationConfigResponse = ApiResponse<{
  organizationConfiguration: Record<string, string>;
}>;

export interface UpdateOrganizationConfigRequest {
  organizationConfiguration: Record<string, string>;
  needsRefresh?: boolean;
  isOnlyOrganizationSettings?: boolean;
  apiConfig?: AxiosRequestConfig;
}

export class OrganizationApi extends Api {
  static tenantsUrl = "v1/tenants";

  static async fetchCurrentOrganizationConfig(): Promise<
    AxiosPromise<FetchCurrentOrganizationConfigResponse>
  > {
    return Api.get(`${OrganizationApi.tenantsUrl}/current`);
  }

  static async updateOrganizationConfig(
    request: UpdateOrganizationConfigRequest,
  ): Promise<AxiosPromise<UpdateOrganizationConfigResponse>> {
    return Api.put(
      `${OrganizationApi.tenantsUrl}`,
      request.organizationConfiguration,
      null,
      {
        ...(request.apiConfig || {}),
      },
    );
  }
}

export default OrganizationApi;
