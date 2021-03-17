import API, { HttpMethod } from "./Api";
import { ApiResponse, GenericApiResponse, ResponseMeta } from "./ApiResponses";
import {
  APIRequest,
  DEFAULT_EXECUTE_ACTION_TIMEOUT_MS,
} from "constants/ApiConstants";
import axios, { AxiosPromise, CancelTokenSource } from "axios";
import { Action, ActionViewMode } from "entities/Action";

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
  actionId: string;
  params?: Property[];
  paginationField?: PaginationField;
  viewMode: boolean;
}

export interface ExecuteActionResponse extends ApiResponse {
  actionId: string;
  data: any;
}

export interface ActionApiResponseReq {
  headers: Record<string, string[]>;
  body: Record<string, unknown> | null;
  httpMethod: HttpMethod | "";
  url: string;
}

export interface ActionApiResponse {
  responseMeta: ResponseMeta;
  data: {
    body: Record<string, unknown>;
    headers: Record<string, string[]>;
    statusCode: string;
    isExecutionSuccess: boolean;
    request: ActionApiResponseReq;
  };
  clientMeta: {
    duration: string;
    size: string;
  };
}

export interface ActionResponse {
  body: unknown;
  headers: Record<string, string[]>;
  request?: ActionApiResponseReq;
  statusCode: string;
  duration: string;
  size: string;
  isExecutionSuccess?: boolean;
}

export interface MoveActionRequest {
  action: Action;
  destinationPageId: string;
}

export interface CopyActionRequest {
  action: Action;
  pageId: string;
}

export interface UpdateActionNameRequest {
  pageId: string;
  layoutId: string;
  newName: string;
  oldName: string;
}

class ActionAPI extends API {
  static url = "v1/actions";
  static apiUpdateCancelTokenSource: CancelTokenSource;
  static queryUpdateCancelTokenSource: CancelTokenSource;

  static fetchAPI(id: string): AxiosPromise<GenericApiResponse<Action>> {
    return API.get(`${ActionAPI.url}/${id}`);
  }

  static createAPI(
    apiConfig: Partial<Action>,
  ): AxiosPromise<ActionCreateUpdateResponse> {
    return API.post(ActionAPI.url, apiConfig);
  }

  static fetchActions(
    applicationId: string,
  ): AxiosPromise<GenericApiResponse<Action[]>> {
    return API.get(ActionAPI.url, { applicationId });
  }

  static fetchActionsForViewMode(
    applicationId: string,
  ): AxiosPromise<GenericApiResponse<ActionViewMode[]>> {
    return API.get(`${ActionAPI.url}/view`, { applicationId });
  }

  static fetchActionsByPageId(
    pageId: string,
  ): AxiosPromise<GenericApiResponse<Action[]>> {
    return API.get(ActionAPI.url, { pageId });
  }

  static updateAPI(
    apiConfig: Partial<Action>,
  ): AxiosPromise<ActionCreateUpdateResponse> {
    if (ActionAPI.apiUpdateCancelTokenSource) {
      ActionAPI.apiUpdateCancelTokenSource.cancel();
    }
    ActionAPI.apiUpdateCancelTokenSource = axios.CancelToken.source();
    const action = Object.assign({}, apiConfig);
    // While this line is not required, name can not be changed from this endpoint
    delete action.name;
    return API.put(`${ActionAPI.url}/${action.id}`, action, undefined, {
      cancelToken: ActionAPI.apiUpdateCancelTokenSource.token,
    });
  }

  static updateActionName(updateActionNameRequest: UpdateActionNameRequest) {
    return API.put(ActionAPI.url + "/refactor", updateActionNameRequest);
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
    if (ActionAPI.queryUpdateCancelTokenSource) {
      ActionAPI.queryUpdateCancelTokenSource.cancel();
    }
    ActionAPI.queryUpdateCancelTokenSource = axios.CancelToken.source();
    return API.post(ActionAPI.url, updateQuery, undefined, {
      cancelToken: ActionAPI.queryUpdateCancelTokenSource.token,
    });
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
    return API.put(ActionAPI.url + "/move", moveRequest, undefined, {
      timeout: DEFAULT_EXECUTE_ACTION_TIMEOUT_MS,
    });
  }

  static executeQuery(executeAction: any): AxiosPromise<ActionApiResponse> {
    return API.post(ActionAPI.url + "/execute", executeAction);
  }

  static toggleActionExecuteOnLoad(actionId: string, shouldExecute: boolean) {
    return API.put(ActionAPI.url + `/executeOnLoad/${actionId}`, undefined, {
      flag: shouldExecute.toString(),
    });
  }
}

export default ActionAPI;
