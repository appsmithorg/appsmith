import API from "./Api";
import { GenericApiResponse } from "./ApiResponses";

interface ResourceAuthentication {
  authType: string;
}

export interface Resource {
  id: string;
  name: string;
  pluginId: string;
  organizationId?: string;
  resourceConfiguration: {
    url: string;
    authentication?: ResourceAuthentication;
    properties?: Record<string, string>;
    headers?: Record<string, string>;
    databaseName?: string;
  };
}

export interface CreateResourceConfig {
  name: string;
  pluginId: string;
  resourceConfiguration: {
    url: string;
  };
}

class ResourcesApi extends API {
  static url = "v1/resources";

  static fetchResources(): Promise<GenericApiResponse<Resource[]>> {
    return API.get(ResourcesApi.url);
  }

  static createResource(resourceConfig: Partial<Resource>): Promise<{}> {
    return API.post(ResourcesApi.url, resourceConfig);
  }
}

export default ResourcesApi;
