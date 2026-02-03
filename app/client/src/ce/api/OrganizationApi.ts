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

export interface AIConfigResponse {
  isAIAssistantEnabled: boolean;
  provider: string | null;
  hasClaudeApiKey: boolean;
  hasOpenaiApiKey: boolean;
  hasCopilotApiKey: boolean;
  localLlmUrl?: string;
  localLlmContextSize?: number;
}

export interface AIConfigRequest {
  claudeApiKey?: string;
  openaiApiKey?: string;
  copilotApiKey?: string;
  localLlmUrl?: string;
  localLlmContextSize?: number;
  provider: string;
  isAIAssistantEnabled: boolean;
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

  static async getAIConfig(): Promise<
    AxiosPromise<ApiResponse<AIConfigResponse>>
  > {
    return Api.get(`${OrganizationApi.tenantsUrl}/ai-config`);
  }

  static async updateAIConfig(
    request: AIConfigRequest,
  ): Promise<AxiosPromise<ApiResponse<AIConfigResponse>>> {
    return Api.put(`${OrganizationApi.tenantsUrl}/ai-config`, request);
  }

  static async testLlmConnection(
    url: string,
  ): Promise<AxiosPromise<ApiResponse<Record<string, unknown>>>> {
    return Api.post(`${OrganizationApi.tenantsUrl}/ai-config/test-connection`, {
      url,
    });
  }

  static async testApiKey(
    provider: string,
    apiKey?: string,
  ): Promise<AxiosPromise<ApiResponse<Record<string, unknown>>>> {
    return Api.post(`${OrganizationApi.tenantsUrl}/ai-config/test-api-key`, {
      provider,
      apiKey,
    });
  }
}

export default OrganizationApi;
