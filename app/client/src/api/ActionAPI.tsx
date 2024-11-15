import type React from "react";
import type { HttpMethod } from "api/Api";
import API from "api/Api";
import type { ApiResponse } from "./ApiResponses";
import { DEFAULT_EXECUTE_ACTION_TIMEOUT_MS } from "ee/constants/ApiConstants";
import type { AxiosPromise, CancelTokenSource } from "axios";
import axios from "axios";
import type { Action, ActionViewMode } from "entities/Action";
import type { APIRequest } from "constants/AppsmithActionConstants/ActionConstants";
import type { WidgetType } from "constants/WidgetConstants";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";

export interface Property {
  key: string;
  value?: string;
}

export type ActionCreateUpdateResponse = ApiResponse & {
  id: string;
  baseId: string;
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const payload = {
      ...apiConfig,
      eventData: undefined,
      isValid: undefined,
      entityReferenceType: undefined,
      datasource: {
        ...apiConfig.datasource,
        isValid: undefined,
        new: undefined,
      },
    };

    return API.post(ActionAPI.url, payload);
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
    const payload: Partial<Action & { entityReferenceType: unknown }> = {
      ...apiConfig,
      name: undefined,
      entityReferenceType: undefined,
      actionConfiguration: apiConfig.actionConfiguration && {
        ...apiConfig.actionConfiguration,
        autoGeneratedHeaders:
          apiConfig.actionConfiguration.autoGeneratedHeaders?.map(
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (header: any) => ({
              ...header,
              isInvalid: undefined,
            }),
          ) ?? undefined,
      },
      datasource: apiConfig.datasource && {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(apiConfig as any).datasource,
        datasourceStorages: undefined,
        isValid: undefined,
        new: undefined,
      },
    };

    return API.put(`${ActionAPI.url}/${apiConfig.id}`, payload, undefined, {
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
      },
      cancelToken: ActionAPI.abortActionExecutionTokenSource.token,
    });
  }

  static async executeAction(
    executeAction: FormData,
    timeout?: number,
  ): Promise<AxiosPromise<ActionExecutionResponse>> {
    ActionAPI.abortActionExecutionTokenSource = axios.CancelToken.source();

    return await this.executeApiCall(executeAction, timeout);
  }

  static async moveAction(moveRequest: MoveActionRequest) {
    const payload = {
      ...moveRequest,
      action: moveRequest.action && {
        ...moveRequest.action,
        entityReferenceType: undefined,
        datasource: moveRequest.action.datasource && {
          ...moveRequest.action.datasource,
          isValid: undefined,
          new: undefined,
        },
      },
    };

    return API.put(ActionAPI.url + "/move", payload, undefined, {
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
