import API, { HttpMethod } from "api/Api";
import { AxiosPromise, CancelTokenSource } from "axios";
import { JSAction } from "entities/JSAction";
import { ApiResponse, GenericApiResponse } from "./ApiResponses";

export type PaginationField = "PREV" | "NEXT";

export interface ActionApiResponseReq {
  headers: Record<string, string[]>;
  body: Record<string, unknown> | null;
  httpMethod: HttpMethod | "";
  url: string;
}
export interface JSActionCreateUpdateResponse extends ApiResponse {
  id: string;
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
  ): AxiosPromise<GenericApiResponse<JSAction[]>> {
    return API.get(JSActionAPI.url, { applicationId });
  }

  static createJSAction(
    apiConfig: Partial<JSAction>,
  ): AxiosPromise<JSActionCreateUpdateResponse> {
    return API.post(JSActionAPI.url, apiConfig);
  }
}

export default JSActionAPI;
