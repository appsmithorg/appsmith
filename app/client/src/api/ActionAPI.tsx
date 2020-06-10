import API from "./Api";
import { ApiResponse, GenericApiResponse, ResponseMeta } from "./ApiResponses";
import {
  APIRequest,
  DEFAULT_EXECUTE_ACTION_TIMEOUT_MS,
} from "constants/ApiConstants";
import { AxiosPromise } from "axios";
import { RestAction } from "entities/Action";

export interface CreateActionRequest<T> extends APIRequest {
  datasourceId: string;
  pageId: string;
  name: string;
  actionConfiguration: T;
}

export interface UpdateActionRequest<T> extends CreateActionRequest<T> {
  actionId: string;
}

export interface Property {
  key: string;
  value?: string;
}

export interface BodyFormData {
  editable: boolean;
  mandatory: boolean;
  description: string;
  key: string;
  value?: string;
  type: string;
}

export interface QueryConfig {
  queryString: string;
}

export interface ActionCreateUpdateResponse extends ApiResponse {
  id: string;
  jsonPathKeys: Record<string, string>;
}

export type PaginationField = "PREV" | "NEXT";

export interface ExecuteActionRequest extends APIRequest {
  action: Pick<RestAction, "id"> | Omit<RestAction, "id">;
  params?: Property[];
  paginationField?: PaginationField;
}

export interface ExecuteQueryRequest extends APIRequest {
  action: Pick<RestAction, "id"> | Omit<RestAction, "id">;
}

export interface ExecuteActionResponse extends ApiResponse {
  actionId: string;
  data: any;
}

export interface ActionApiResponse {
  responseMeta: ResponseMeta;
  data: {
    body: object;
    headers: Record<string, string[]>;
    statusCode: string;
    isExecutionSuccess: boolean;
    requestHeaders: Record<string, string[]>;
    requestBody: object | null;
  };
  clientMeta: {
    duration: string;
    size: string;
  };
}

export interface ActionResponse {
  body: object;
  headers: Record<string, string[]>;
  requestBody: object | null;
  requestHeaders: Record<string, string[]>;
  statusCode: string;
  duration: string;
  size: string;
}

export interface MoveActionRequest {
  action: RestAction;
  destinationPageId: string;
}

export interface CopyActionRequest {
  action: RestAction;
  pageId: string;
}

class ActionAPI extends API {
  static url = "v1/actions";

  static fetchAPI(id: string): AxiosPromise<GenericApiResponse<RestAction>> {
    return API.get(`${ActionAPI.url}/${id}`);
  }

  static createAPI(
    apiConfig: RestAction,
  ): AxiosPromise<ActionCreateUpdateResponse> {
    return API.post(ActionAPI.url, apiConfig);
  }

  static fetchActions(
    applicationId: string,
  ): AxiosPromise<GenericApiResponse<RestAction[]>> {
    return API.get(ActionAPI.url, { applicationId });
  }

  static fetchActionsByPageId(
    pageId: string,
  ): AxiosPromise<GenericApiResponse<RestAction[]>> {
    return API.get(ActionAPI.url, { pageId });
  }

  static updateAPI(
    apiConfig: Partial<RestAction>,
  ): AxiosPromise<ActionCreateUpdateResponse> {
    return API.put(`${ActionAPI.url}/${apiConfig.id}`, apiConfig);
  }

  static deleteAction(id: string) {
    return API.delete(`${ActionAPI.url}/${id}`);
  }

  static createQuery(
    createQuery: CreateActionRequest<QueryConfig>,
  ): AxiosPromise<ActionCreateUpdateResponse> {
    return API.post(ActionAPI.url, createQuery);
  }

  static updateQuery(
    updateQuery: UpdateActionRequest<QueryConfig>,
  ): AxiosPromise<ActionCreateUpdateResponse> {
    return API.post(ActionAPI.url, updateQuery);
  }

  static executeAction(
    executeAction: ExecuteActionRequest,
    timeout?: number,
  ): AxiosPromise<ActionApiResponse> {
    return API.post(ActionAPI.url + "/execute", executeAction, undefined, {
      timeout: timeout || DEFAULT_EXECUTE_ACTION_TIMEOUT_MS,
    });
  }

  static moveAction(moveRequest: MoveActionRequest) {
    return API.put(ActionAPI.url + "/move", moveRequest);
  }

  static executeQuery(executeAction: any): AxiosPromise<ActionApiResponse> {
    return API.post(ActionAPI.url + "/execute", executeAction);
  }
}

export default ActionAPI;
