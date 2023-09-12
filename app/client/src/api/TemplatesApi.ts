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

export type PublishCommunityTemplateRequest = {
  applicationId: string;
  workspaceId: string;
  branchName: string;
  title: string;
  headline: string;
  description: string;
  useCases: string[];
  authorEmail: string;
};

export type PublishCommunityTemplateResponse = ApiResponse<{
  isPublic: boolean;
  forkingEnabled: boolean;
  isCommunityTemplate: boolean;
  modifiedAt: string;
}>;

class TemplatesAPI extends Api {
  static baseUrl = "v1";

  static getAllTemplates(): AxiosPromise<FetchTemplatesResponse> {
    return Api.get(TemplatesAPI.baseUrl + `/app-templates`);
  }
  static getTemplateInformation(
    templateId: string,
  ): AxiosPromise<FetchTemplatesResponse> {
    return Api.get(TemplatesAPI.baseUrl + `/app-templates/${templateId}`);
  }
  static getSimilarTemplates(
    templateId: string,
  ): AxiosPromise<FetchTemplatesResponse> {
    return Api.get(
      TemplatesAPI.baseUrl + `/app-templates/${templateId}/similar`,
    );
  }
  static importTemplate(
    templateId: string,
    workspaceId: string,
  ): AxiosPromise<ImportTemplateResponse> {
    return Api.post(
      TemplatesAPI.baseUrl +
        `/app-templates/${templateId}/import/${workspaceId}`,
    );
  }
  static importTemplateToApplication(
    templateId: string,
    applicationId: string,
    organizationId: string,
    body?: string[],
  ): AxiosPromise<ImportTemplateResponse> {
    return Api.post(
      TemplatesAPI.baseUrl +
        `/app-templates/${templateId}/merge/${applicationId}/${organizationId}`,
      body,
    );
  }
  static getTemplateFilters(): AxiosPromise<TemplateFiltersResponse> {
    return Api.get(TemplatesAPI.baseUrl + `/app-templates/filters`);
  }
  static publishCommunityTemplate(
    applicationId: string,
    workspaceId: string,
    body: PublishCommunityTemplateRequest,
  ): AxiosPromise<PublishCommunityTemplateResponse> {
    return Api.post(
      TemplatesAPI.baseUrl +
        `/app-templates/publish/${applicationId}/${workspaceId}`,
      body,
    );
  }
}

export default TemplatesAPI;
