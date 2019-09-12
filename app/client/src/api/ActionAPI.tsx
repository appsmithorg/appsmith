import Api, { HttpMethod } from "./Api"
import { ContainerWidgetProps } from "../widgets/ContainerWidget"
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

export interface PageResponse extends ApiResponse {
  pageWidget: ContainerWidgetProps<any>;
}

export interface SavePageResponse {
  pageId: string;
}

class ActionAPI extends Api {
  static url = "/actions"
  
  static createAPI(createAPI: CreateActionRequest<APIConfig>): Promise<PageResponse> {
    return Api.post(ActionAPI.url, createAPI)
  }

  static updateAPI(updateAPI: UpdateActionRequest<APIConfig>): Promise<PageResponse> {
    return Api.post(ActionAPI.url, updateAPI)
  }

  static createQuery(createQuery: CreateActionRequest<QueryConfig>): Promise<PageResponse> {
    return Api.post(ActionAPI.url, createQuery)
  }

  static updateQuery(updateQuery: UpdateActionRequest<QueryConfig>): Promise<PageResponse> {
    return Api.post(ActionAPI.url, updateQuery)
  }
  
}




export default ActionAPI
