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

export type FetchProviderDetailsResponse = ApiResponse & {
  data: ProvidersDataArray;
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

export type ApiTemplates = {
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

export type SearchResultsProviders = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  url: string;
  documentationUrl: string;
};

export const DEFAULT_TEMPLATE_TYPE = "TEMPLATE";

export const providerBackgroundColors = [
  "#0BA780",
  "#929500",
  "#1F97D3",
  "#B32FA5",
  "#1A29B1",
  "#2965CC",
  "#4E5D78",
  "#14928B",
  "#FBBEBE",
];
