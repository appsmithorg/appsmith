import type React from "react";
import type { HttpMethod } from "api/Api";
import API from "api/Api";
import type { ApiResponse } from "./ApiResponses";
import { DEFAULT_EXECUTE_ACTION_TIMEOUT_MS } from "@appsmith/constants/ApiConstants";
import type { AxiosPromise, CancelTokenSource } from "axios";
import axios from "axios";
import type { Action, ActionViewMode } from "entities/Action";
import type { APIRequest } from "constants/AppsmithActionConstants/ActionConstants";
import type { WidgetType } from "constants/WidgetConstants";
import type { OtlpSpan } from "UITelemetry/generateTraces";
import { wrapFnWithParentTraceContext } from "UITelemetry/generateTraces";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";

export interface Property {
  key: string;
  value?: string;
}

export type ActionCreateUpdateResponse = ApiResponse & {
  id: string;
  jsonPathKeys: Record<string, string>;
  datasource: {
    id?: string;
  };
};

export type PaginationField = "PREV" | "NEXT";

export interface ExecuteActionRequest extends APIRequest {
  actionId: string;
  params?: Property[];
  paginationField?: PaginationField;
  viewMode: boolean;
  paramProperties: Record<
    string,
    | string
    | Record<string, Array<string>>
    | Record<string, string>
    | Record<string, Record<string, Array<string>>>
  >;
  analyticsProperties?: Record<string, boolean>;
}

export interface ActionApiResponseReq {
  headers: Record<string, string[]>;
  body: Record<string, unknown> | null;
  httpMethod: HttpMethod | "";
  url: string;
  requestedAt?: number;
}

export type ActionExecutionResponse = ApiResponse<{
  body: Record<string, unknown> | string;
  headers: Record<string, string[]>;
  statusCode: string;
  isExecutionSuccess: boolean;
  request: ActionApiResponseReq;
  errorType?: string;
  dataTypes: any[];
}> & {
  clientMeta: {
    duration: string;
    size: string;
  };
};

export interface SuggestedWidget {
  type: WidgetType;
  bindingQuery: string;
}

export interface ActionResponse {
  body: React.ReactNode;
  headers: Record<string, string[]>;
  request?: ActionApiResponseReq;
  statusCode: string;
  dataTypes: Record<string, string>[];
  duration: string;
  size: string;
  isExecutionSuccess?: boolean;
  suggestedWidgets?: SuggestedWidget[];
  messages?: Array<string>;
  errorType?: string;
  readableError?: string;
  responseDisplayFormat?: string;
  pluginErrorDetails?: PluginErrorDetails;
}

//This contains the error details from the plugin that is sent to the client in the response
//title: The title of the error
//errorType: The type of error that occurred
//appsmithErrorCode: The error code that is used to identify the error in the appsmith
//appsmithErrorMessage: The appsmith error message that is shown to the user
//downstreamErrorCode: The error code that is sent by the plugin
//downstreamErrorMessage: The error message that is sent by the plugin
export interface PluginErrorDetails {
  title: string;
  errorType: string;
  appsmithErrorCode: string;
  appsmithErrorMessage: string;
  downstreamErrorCode?: string;
  downstreamErrorMessage?: string;
}

export interface MoveActionRequest {
  action: Action;
  destinationPageId: string;
}

export interface UpdateActionNameRequest {
  pageId?: string;
  actionId: string;
  layoutId?: string;
  newName: string;
  oldName: string;
  moduleId?: string;
  workflowId?: string;
  contextType?: ActionParentEntityTypeInterface;
}

export interface FetchActionsPayload {
  applicationId?: string;
  workflowId?: string;
}
class ActionAPI extends API {
  static url = "v1/actions";
  static apiUpdateCancelTokenSource: CancelTokenSource;
  static queryUpdateCancelTokenSource: CancelTokenSource;
  static abortActionExecutionTokenSource: CancelTokenSource;

  static async createAction(
    apiConfig: Partial<Action>,
  ): Promise<AxiosPromise<ActionCreateUpdateResponse>> {
    return API.post(ActionAPI.url, { ...apiConfig, eventData: undefined });
  }

  static async fetchActions(
    payload: FetchActionsPayload,
  ): Promise<AxiosPromise<ApiResponse<Action[]>>> {
    return API.get(ActionAPI.url, payload);
  }

  static async fetchActionsForViewMode(
    applicationId: string,
  ): Promise<AxiosPromise<ApiResponse<ActionViewMode[]>>> {
    return API.get(`${ActionAPI.url}/view`, { applicationId });
  }

  static async fetchActionsByPageId(
    pageId: string,
  ): Promise<AxiosPromise<ApiResponse<Action[]>>> {
    return API.get(ActionAPI.url, { pageId });
  }

  static async updateAction(
    apiConfig: Partial<Action>,
  ): Promise<AxiosPromise<ActionCreateUpdateResponse>> {
    if (ActionAPI.apiUpdateCancelTokenSource) {
      ActionAPI.apiUpdateCancelTokenSource.cancel();
    }
    ActionAPI.apiUpdateCancelTokenSource = axios.CancelToken.source();
    const action: Partial<Action & { entityReferenceType: unknown }> = {
      ...apiConfig,
      name: undefined,
      entityReferenceType: undefined,
    };
    if (action.datasource != null) {
      action.datasource = {
        ...(action as any).datasource,
        datasourceStorages: undefined,
        isValid: undefined,
      };
    }
    return API.put(`${ActionAPI.url}/${action.id}`, action, undefined, {
      cancelToken: ActionAPI.apiUpdateCancelTokenSource.token,
    });
  }

  static async updateActionName(
    updateActionNameRequest: UpdateActionNameRequest,
  ) {
    return API.put(ActionAPI.url + "/refactor", updateActionNameRequest);
  }

  static async deleteAction(id: string) {
    return API.delete(`${ActionAPI.url}/${id}`);
  }
  private static async executeApiCall(
    executeAction: FormData,
    timeout?: number,
  ): Promise<AxiosPromise<ActionExecutionResponse>> {
    return API.post(ActionAPI.url + "/execute", executeAction, undefined, {
      timeout: timeout || DEFAULT_EXECUTE_ACTION_TIMEOUT_MS,
      headers: {
        accept: "application/json",
        "Content-Type": "multipart/form-data",
        Expect: "100-continue",
      },
      cancelToken: ActionAPI.abortActionExecutionTokenSource.token,
    });
  }

  static async executeAction(
    executeAction: FormData,
    timeout?: number,
    parentSpan?: OtlpSpan,
  ): Promise<AxiosPromise<ActionExecutionResponse>> {
    ActionAPI.abortActionExecutionTokenSource = axios.CancelToken.source();
    if (!parentSpan) {
      return this.executeApiCall(executeAction, timeout);
    }
    return wrapFnWithParentTraceContext(parentSpan, async () => {
      return await this.executeApiCall(executeAction, timeout);
    });
  }

  static async moveAction(moveRequest: MoveActionRequest) {
    return API.put(ActionAPI.url + "/move", moveRequest, undefined, {
      timeout: DEFAULT_EXECUTE_ACTION_TIMEOUT_MS,
    });
  }

  static async toggleActionExecuteOnLoad(
    actionId: string,
    shouldExecute: boolean,
  ) {
    return API.put(ActionAPI.url + `/executeOnLoad/${actionId}`, undefined, {
      flag: shouldExecute.toString(),
    });
  }
}

export default ActionAPI;
