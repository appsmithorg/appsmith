import type { AxiosPromise } from "axios";
import Api from "api/Api";
import type { ApiResponse } from "./ApiResponses";
import type { WidgetType } from "constants/WidgetConstants";
import type {
  ApplicationResponsePayload,
  ApplicationPagePayload,
} from "@appsmith/api/ApplicationApi";
import type { Datasource } from "entities/Datasource";

export interface Template {
  id: string;
  userPermissions: string[];
  title: string;
  description: string;
  appUrl: string;
  gifUrl: string;
  screenshotUrls: string[];
  widgets: WidgetType[];
  functions: string[];
  useCases: string[];
  datasources: string[];
  pages: ApplicationPagePayload[];
  allowPageImport: boolean;
}

export type FetchTemplatesResponse = ApiResponse<Template[]>;
export type FilterKeys = "widgets" | "datasources";

export type FetchTemplateResponse = ApiResponse<Template>;

export type ImportTemplateResponse = ApiResponse<{
  isPartialImport: boolean;
  unConfiguredDatasourceList: Datasource[];
  application: ApplicationResponsePayload;
}>;

export interface TemplateFiltersResponse extends ApiResponse {
  data: {
    functions: string[];
    useCases?: string[];
  };
}

export interface PublishCommunityTemplateRequest {
  applicationId: string;
  workspaceId: string;
  branchName: string;
  title: string;
  headline: string;
  description: string;
  useCases: string[];
  authorEmail: string;
}

export type PublishCommunityTemplateResponse = ApiResponse<{
  isPublic: boolean;
  forkingEnabled: boolean;
  isCommunityTemplate: boolean;
  modifiedAt: string;
}>;

class TemplatesAPI extends Api {
  static baseUrl = "v1";

  static async getAllTemplates(): Promise<
    AxiosPromise<FetchTemplatesResponse>
  > {
    return Api.get(TemplatesAPI.baseUrl + `/app-templates`);
  }
  static async getTemplateInformation(
    templateId: string,
  ): Promise<AxiosPromise<FetchTemplatesResponse>> {
    return Api.get(TemplatesAPI.baseUrl + `/app-templates/${templateId}`);
  }
  static async getSimilarTemplates(
    templateId: string,
  ): Promise<AxiosPromise<FetchTemplatesResponse>> {
    return Api.get(
      TemplatesAPI.baseUrl + `/app-templates/${templateId}/similar`,
    );
  }
  static async importTemplate(
    templateId: string,
    workspaceId: string,
  ): Promise<AxiosPromise<ImportTemplateResponse>> {
    return Api.post(
      TemplatesAPI.baseUrl +
        `/app-templates/${templateId}/import/${workspaceId}`,
    );
  }
  static async importTemplateToApplication(
    templateId: string,
    applicationId: string,
    organizationId: string,
    body?: string[],
  ): Promise<AxiosPromise<ImportTemplateResponse>> {
    return Api.post(
      TemplatesAPI.baseUrl +
        `/app-templates/${templateId}/merge/${applicationId}/${organizationId}`,
      body,
    );
  }
  static async getTemplateFilters(): Promise<
    AxiosPromise<TemplateFiltersResponse>
  > {
    return Api.get(TemplatesAPI.baseUrl + `/app-templates/filters`);
  }
  static async publishCommunityTemplate(
    applicationId: string,
    workspaceId: string,
    body: PublishCommunityTemplateRequest,
  ): Promise<AxiosPromise<PublishCommunityTemplateResponse>> {
    return Api.post(
      TemplatesAPI.baseUrl +
        `/app-templates/publish/${applicationId}/${workspaceId}`,
      body,
    );
  }
}

export default TemplatesAPI;
