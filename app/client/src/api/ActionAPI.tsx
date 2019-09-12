import Api, { HttpMethod } from "./Api"
import { ApiResponse } from "./ApiResponses"
import { APIRequest } from './ApiRequests';

export interface CreateActionRequest<T> extends APIRequest {
  resourceId: string
  actionConfiguration: T
}

export interface UpdateActionRequest<T> extends CreateActionRequest<T> {
  actionId: string
}

export interface APIConfig {
  requestHeaders: Record<string, string>
  method: HttpMethod
  path: string
  APIName: string
  body: JSON
  queryParams: Record<string, string>
}

export interface QueryConfig {
  queryString: string
}

export interface ActionCreatedResponse extends ApiResponse {
  actionId: string
}

export interface ActionUpdatedResponse extends ActionCreatedResponse {
  
}

export interface ExecuteActionRequest extends APIRequest {
  actionId: string
  dynamicBindingMap: Record<string, string>
}

export interface ExecuteActionResponse extends ApiResponse {
  actionId: string
  data: any
}

class ActionAPI extends Api {
  static url = "/actions"
  
  static createAPI(createAPI: CreateActionRequest<APIConfig>): Promise<ActionCreatedResponse> {
    return Api.post(ActionAPI.url, createAPI)
  }

  static updateAPI(updateAPI: UpdateActionRequest<APIConfig>): Promise<ActionUpdatedResponse> {
    return Api.post(ActionAPI.url, updateAPI)
  }

  static createQuery(createQuery: CreateActionRequest<QueryConfig>): Promise<ActionCreatedResponse> {
    return Api.post(ActionAPI.url, createQuery)
  }

  static updateQuery(updateQuery: UpdateActionRequest<QueryConfig>): Promise<ActionUpdatedResponse> {
    return Api.post(ActionAPI.url, updateQuery)
  }

  static executeAction(executeAction: ExecuteActionRequest): Promise<ActionUpdatedResponse> {
    return Api.post(ActionAPI.url, executeAction)
  }

}

export default ActionAPI
