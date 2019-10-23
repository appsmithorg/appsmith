import API, { HttpMethod } from "./Api";
import { ApiResponse, GenericApiResponse } from "./ApiResponses";
import { APIRequest } from "../constants/ApiConstants";

export interface CreateActionRequest<T> extends APIRequest {
  resourceId: string;
  pageId: string;
  name: string;
  actionConfiguration: T;
}

export interface UpdateActionRequest<T> extends CreateActionRequest<T> {
  actionId: string;
}

export interface APIConfig {
  resourceId: string;
  pageId: string;
  name: string;
  requestHeaders: Record<string, string>;
  httpMethod: HttpMethod;
  path: string;
  body: JSON;
  queryParams: Record<string, string>;
  actionId: string;
}

export interface Property {
  key: string;
  value: string;
}

export interface APIConfigRequest {
  headers: Property[];
  httpMethod: string;
  path: string;
  body: JSON | string;
  queryParameters: Property[];
}

export interface QueryConfig {
  queryString: string;
}

export interface ActionCreateUpdateResponse extends ApiResponse {
  id: string;
  jsonPathKeys: Record<string, string>;
}

export interface RestAction {
  id: string;
  name: string;
  resourceId: string;
  pluginId: string;
  pageId: string;
  actionConfiguration: Partial<APIConfigRequest>;
}

export interface ExecuteActionRequest extends APIRequest {
  actionId: string;
  dynamicBindingList?: Property[];
}

export interface ExecuteActionResponse extends ApiResponse {
  actionId: string;
  data: any;
}

class ActionAPI extends API {
  static url = "v1/actions";

  static fetchAPI(id: string): Promise<GenericApiResponse<RestAction>> {
    return API.get(`${ActionAPI.url}/${id}`);
  }

  static createAPI(apiConfig: RestAction): Promise<ActionCreateUpdateResponse> {
    return API.post(ActionAPI.url, apiConfig);
  }

  static fetchActions(): Promise<GenericApiResponse<RestAction[]>> {
    return API.get(ActionAPI.url);
  }

  static updateAPI(
    apiConfig: Partial<RestAction>,
  ): Promise<ActionCreateUpdateResponse> {
    return API.put(`${ActionAPI.url}/${apiConfig.id}`, null, apiConfig);
  }

  static deleteAction(id: string) {
    return API.delete(`${ActionAPI.url}/${id}`);
  }

  static createQuery(
    createQuery: CreateActionRequest<QueryConfig>,
  ): Promise<ActionCreateUpdateResponse> {
    return API.post(ActionAPI.url, createQuery);
  }

  static updateQuery(
    updateQuery: UpdateActionRequest<QueryConfig>,
  ): Promise<ActionCreateUpdateResponse> {
    return API.post(ActionAPI.url, updateQuery);
  }

  static executeAction(
    executeAction: ExecuteActionRequest,
  ): Promise<ActionCreateUpdateResponse> {
    return API.post(ActionAPI.url + "/execute", executeAction);
  }
}

export default ActionAPI;
