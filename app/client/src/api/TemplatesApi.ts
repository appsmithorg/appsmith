import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { WidgetType } from "constants/WidgetConstants";
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
}

class TemplatesAPI extends Api {
  static baseUrl = "v1";

  static getAllTemplates(): AxiosPromise<ApiResponse<Template[]>> {
    return Api.get(TemplatesAPI.baseUrl + `/app-templates`);
  }
  static getTemplateInformation(
    templateId: string,
  ): AxiosPromise<ApiResponse<Template>> {
    return Api.get(TemplatesAPI.baseUrl + `/app-templates/${templateId}`);
  }
  static getSimilarTemplates(
    templateId: string,
  ): AxiosPromise<ApiResponse<Template[]>> {
    return Api.get(
      TemplatesAPI.baseUrl + `/app-templates/${templateId}/similar`,
    );
  }
  static importTemplate(
    templateId: string,
    organizationId: string,
  ): AxiosPromise<unknown> {
    return Api.post(
      TemplatesAPI.baseUrl +
        `/app-templates/${templateId}/import/${organizationId}`,
    );
  }
}

export default TemplatesAPI;
