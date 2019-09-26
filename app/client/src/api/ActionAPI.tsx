import API, { HttpMethod } from "./Api";
import { ApiResponse } from "./ApiResponses";
import { APIRequest } from "../constants/ApiConstants";
import { mapToPropList } from "../utils/AppsmithUtils";

export interface CreateActionRequest<T> extends APIRequest {
  resourceId: string;
  actionName: string;
  actionConfiguration: T;
}

export interface UpdateActionRequest<T> extends CreateActionRequest<T> {
  actionId: string;
}

export interface APIConfig {
  resourceId: string;
  actionName: string;
  requestHeaders: Record<string, string>;
  method: HttpMethod;
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
  httpMethod: HttpMethod;
  path: string;
  body: JSON;
  queryParameters: Property[];
}

export interface QueryConfig {
  queryString: string;
}

export interface ActionCreateUpdateResponse extends ApiResponse {
  actionId: string;
  dynamicBindingMap: Record<string, string>;
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

  static createAPI(apiConfig: APIConfig): Promise<ActionCreateUpdateResponse> {
    const createAPI: CreateActionRequest<APIConfigRequest> = {
      resourceId: apiConfig.resourceId,
      actionName: apiConfig.actionName,
      actionConfiguration: {
        httpMethod: apiConfig.method,
        path: apiConfig.path,
        body: apiConfig.body,
        headers: mapToPropList(apiConfig.requestHeaders),
        queryParameters: mapToPropList(apiConfig.queryParams),
      },
    };
    return API.post(ActionAPI.url, createAPI);
  }

  static updateAPI(apiConfig: APIConfig): Promise<ActionCreateUpdateResponse> {
    const updateAPI: UpdateActionRequest<APIConfigRequest> = {
      resourceId: apiConfig.resourceId,
      actionName: apiConfig.actionName,
      actionId: apiConfig.actionId,
      actionConfiguration: {
        httpMethod: apiConfig.method,
        path: apiConfig.path,
        body: apiConfig.body,
        headers: mapToPropList(apiConfig.requestHeaders),
        queryParameters: mapToPropList(apiConfig.queryParams),
      },
    };
    return API.post(ActionAPI.url, updateAPI);
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
