import API, { HttpMethod } from "api/Api";
import { GenericApiResponse } from "./ApiResponses";
import { AxiosPromise, CancelTokenSource } from "axios";
import { Action } from "entities/Action";

export type PaginationField = "PREV" | "NEXT";

export interface ActionApiResponseReq {
  headers: Record<string, string[]>;
  body: Record<string, unknown> | null;
  httpMethod: HttpMethod | "";
  url: string;
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

class JSActionAPI extends API {
  static url = "v1/jsactions";
  static apiUpdateCancelTokenSource: CancelTokenSource;
  static queryUpdateCancelTokenSource: CancelTokenSource;

  static fetchJSActions(
    applicationId: string,
  ): AxiosPromise<GenericApiResponse<Action[]>> {
    return API.get(JSActionAPI.url, { applicationId });
  }
}

export default JSActionAPI;
