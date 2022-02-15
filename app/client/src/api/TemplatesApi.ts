import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { WidgetType } from "constants/WidgetConstants";
import { ApplicationResponsePayload } from "./ApplicationApi";

// {
//     "responseMeta": {
//       "status": 200,
//       "success": true
//     },
//     "data": [
//       {
//         "id": "61f447545bf0264436db038e",
//         "userPermissions": [],
//         "title": "Updated title",
//         "description": "Hello world",
//         "appUrl": "http://app.appsmith.com/applications/hello-nayan",
//         "gifUrl": "http://gif.appsmith.com/images/hello",
//         "screenshotUrls": [
//           "http://gif.appsmith.com/images/hello"
//         ],
//         "widgets": [
//           "BUTTON_WIDGET",
//           "MAP_WIDGET",
//           "CHART_WIDGET"
//         ],
//         "functions": [
//           "Customer"
//         ],
//         "useCases": [
//           "Support",
//           "Admin"
//         ],
//         "datasources": [
//           "postgres-plugin",
//           "mongo-plugin",
//           "mongo-plugin"
//         ],
//         "minVersion": "v1.6.8",
//         "minVersionPadded": "000010000600008",
//         "active": true,
//         "new": false
//       }
//     ]
//   }
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
  minVersion: string;
  minVersionPadded: string;
  active: string;
  new: string;
}

export interface FetchTemplatesResponse extends ApiResponse {
  data: Template[];
}

export interface FetchTemplateResponse extends ApiResponse {
  data: Template;
}

export interface ImportTemplateResponse extends ApiResponse {
  data: ApplicationResponsePayload;
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
  static importTemplate(
    templateId: string,
    organizationId: string,
  ): AxiosPromise<any> {
    return Api.post(
      TemplatesAPI.baseUrl +
        `/app-templates/${templateId}/import/${organizationId}`,
    );
  }
}

export default TemplatesAPI;
