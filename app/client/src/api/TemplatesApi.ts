import type { AxiosPromise, Template, FetchTemplatesResponse, FetchTemplateResponse, ImportTemplateResponse, TemplateFiltersResponse, PublishCommunityTemplateRequest, PublishCommunityTemplateResponse } from "./TemplatesApi.types";
import Api from "api/Api";

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
    body: PublishCommunityTemplateRequest,
  ): Promise<AxiosPromise<PublishCommunityTemplateResponse>> {
    return Api.post(
      TemplatesAPI.baseUrl + `/app-templates/publish/community-template`,
      body,
    );
  }
}

export default TemplatesAPI;
