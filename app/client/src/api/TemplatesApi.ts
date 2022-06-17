import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { WidgetType } from "constants/WidgetConstants";
import { ApplicationResponsePayload } from "./ApplicationApi";

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
  pageNames: string[];
}

export type FilterKeys = "widgets" | "datasources";

export interface FetchTemplatesResponse extends ApiResponse {
  data: Template[];
}

export interface FetchTemplateResponse extends ApiResponse {
  data: Template;
}

export interface ImportTemplateResponse extends ApiResponse {
  data: ApplicationResponsePayload;
}

export interface TemplateFiltersResponse extends ApiResponse {
  data: {
    functions: string[];
  };
}

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
}

export default TemplatesAPI;
