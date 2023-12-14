import type { HttpMethod } from "api/Api";
import API from "api/Api";
import type { ApiResponse } from "./ApiResponses";
import { DEFAULT_EXECUTE_ACTION_TIMEOUT_MS } from "@appsmith/constants/ApiConstants";
import type { AxiosPromise, CancelTokenSource } from "axios";
import axios from "axios";
import type { Action, ActionViewMode } from "entities/Action";
import type { APIRequest } from "constants/AppsmithActionConstants/ActionConstants";
import type { WidgetType } from "constants/WidgetConstants";
import { omit } from "lodash";
import type { OtlpSpan } from "UITelemetry/generateTraces";
import { wrapFnWithParentTraceContext } from "UITelemetry/generateTraces";

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

export type ExecuteActionResponse = ApiResponse & {
  actionId: string;
};

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
  body: unknown;
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

export interface CopyActionRequest {
  action: Action;
  pageId: string;
}

export interface UpdateActionNameRequest {
  pageId: string;
  actionId: string;
  layoutId: string;
  newName: string;
  oldName: string;
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
    return API.post(ActionAPI.url, apiConfig);
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
    let action = Object.assign({}, apiConfig);
    // While this line is not required, name can not be changed from this endpoint
    delete action.name;
    // Removing datasource storages from the action object since embedded datasources don't have storages
    action = omit(action, ["datasource.datasourceStorages"]);
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
