import { ApiResponse } from "api/ApiResponses";

export type ProvidersDataArray = ApiResponse & {
  id: string;
  name: string;
  description: string;
  url: string;
  imageUrl: string;
};

export type ProvidersCategoriesResponse = ApiResponse & {
  data: string[];
};

export type Providers = ApiResponse & {
  providers: ProvidersDataArray[];
  total: number;
};

export type ProviderTemplates = ApiResponse & {
  data: Array<ProviderTemplateArray>;
  length: number;
  templateId: string;
};

export type ProviderTemplateArray = ApiResponse & {
  templateData: {
    id: string;
    deleted: boolean;
    name: string;
    providerId: string;
    publisher: string;
    packageName: string;
    versionId: string;
    apiTemplateConfiguration: {
      documentation: string;
      sampleResponse: {
        body: string;
      };
    };
    actionConfiguration: {
      timeoutInMillisecond: number;
      paginationType: string;
      path: string;
      httpMethod: string;
      headers: [];
      routeParameters: [];
    };
    datasourceConfiguration: {
      url: string;
    };
  };
  isOpen: boolean;
  addToPageStatus: boolean;
  addToPageLoading: boolean;
};

export const DEFAULT_TEMPLATE_TYPE = "TEMPLATE";
