// Type definitions for workflowProxy

/**
 * ------------------------------------
 * DEPLOY FLOW TYPES START
 * These types are used in the deploy flow of the workflowProxy
 * ------------------------------------
 */

// interface for holding the appsmith action info
export interface AppsmithActionInfo {
  id: string;
  references: Array<string>;
}

/**
 * ------------------------------------
 * DEPLOY FLOW TYPES END
 * ------------------------------------
 */

/**
 * ------------------------------------
 * EXECUTE FLOW TYPES START
 * These types are used in the execute flow of the workflowProxy
 * ------------------------------------
 */

// interface for the request body of the executeActivity endpoint on workflowProxy
export interface ExecuteAppsmithActivityRequest {
  actionId: string;
  paramProperties: Record<
    string,
    | string
    | Record<string, Array<string>>
    | Record<string, string>
    | Record<string, Record<string, Array<string>>>
  >;
}

export interface ExecuteInboxCreationRequest {
  workflowId: string;
  runId: string;
  requestToUsers: string[];
  requestToGroups: string[];
  title: string;
  description: string;
  userInfo?: Record<string, any>;
  allowedResolutions: string[];
}

export interface ExecuteInboxResolutionRequest {
  workflowId: string;
  runId: string;
  requestId: string;
  resolution: string;
}

// interface for the response body of the executeActivity endpoint on workflowProxy
export interface ExecuteAppsmithActivityResponse {
  success: boolean;
  message: string;
  data?: any;
}

// interface for API call made to appsmith server
export interface AppsmithExecuteActionDTO {
  actionId: string;
  viewmode: boolean;
}

// interface for the response received from appsmith server
export interface AppsmithExecuteAPIResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface APIResponseError {
  code: string | number;
  message: string;
}

export interface ResponseMeta {
  status: number;
  success: boolean;
  error?: APIResponseError;
}

export interface ApiResponse<T = unknown> {
  responseMeta: ResponseMeta;
  data: T;
  code?: string;
}

export interface ActivityOutput {
  shallWaitForSignal: boolean;
  data: any;
}
