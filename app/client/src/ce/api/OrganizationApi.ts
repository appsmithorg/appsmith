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

export type FetchMyOrganizationsResponse = ApiResponse<{
  organizations: Organization[];
}>;

export interface Organization {
  organizationId: string;
  organizationName: string;
  organizationUrl: string;
  state: string;
}

export class OrganizationApi extends Api {
  static tenantsUrl = "v1/tenants";
  static meUrl = "v1/users/me";

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

  static async fetchMyOrganizations(): Promise<
    AxiosPromise<FetchMyOrganizationsResponse>
  > {
    return Api.get(`${OrganizationApi.meUrl}/organizations`);
  }
}

export default OrganizationApi;
