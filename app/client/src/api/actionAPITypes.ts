import type { HttpMethod } from "api/Api";
import type { WidgetType } from "constants/WidgetConstants";

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

export interface ActionApiResponseReq {
  headers: Record<string, string[]>;
  body: Record<string, unknown> | null;
  httpMethod: HttpMethod | "";
  url: string;
  requestedAt?: number;
}

export interface SuggestedWidget {
  type: WidgetType;
  bindingQuery: string;
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
