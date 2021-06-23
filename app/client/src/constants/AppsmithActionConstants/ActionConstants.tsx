import { ErrorActionPayload } from "sagas/ErrorSagas";
import { ActionResponse } from "api/ActionAPI";
import { PluginType } from "entities/Action";
import queryActionSettingsConfig from "constants/AppsmithActionConstants/formConfig/QuerySettingsConfig";
import apiActionSettingsConfig from "constants/AppsmithActionConstants/formConfig/ApiSettingsConfig";
import apiActionEditorConfig from "constants/AppsmithActionConstants/formConfig/ApiEditorConfigs";
import saasActionSettingsConfig from "constants/AppsmithActionConstants/formConfig/GoogleSheetsSettingsConfig";
import apiActionDependencyConfig from "constants/AppsmithActionConstants/formConfig/ApiDependencyConfigs";

export type ExecuteActionPayloadEvent = {
  type: EventType;
  callback?: (result: ExecutionResult) => void;
};

export type ExecutionResult = {
  success: boolean;
};

export type ExecuteActionPayload = {
  dynamicString: string;
  event: ExecuteActionPayloadEvent;
  responseData?: Array<any>;
};

// triggerPropertyName was added as a requirement for logging purposes
export type WidgetExecuteActionPayload = ExecuteActionPayload & {
  triggerPropertyName?: string;
};

export type ContentType =
  | "application/json"
  | "application/x-www-form-urlencoded";

export interface APIHeaders {
  "Content-Type": ContentType;
  Accept?: string;
}

export interface APIRequest {
  requestId?: string;
}

export enum EventType {
  ON_RESET = "ON_RESET",
  ON_PAGE_LOAD = "ON_PAGE_LOAD",
  ON_PREV_PAGE = "ON_PREV_PAGE",
  ON_NEXT_PAGE = "ON_NEXT_PAGE",
  ON_PAGE_SIZE_CHANGE = "ON_PAGE_SIZE_CHANGE",
  ON_ERROR = "ON_ERROR",
  ON_SUCCESS = "ON_SUCCESS",
  ON_ROW_SELECTED = "ON_ROW_SELECTED",
  ON_SEARCH = "ON_SEARCH",
  ON_CLICK = "ON_CLICK",
  ON_DATA_POINT_CLICK = "ON_DATA_POINT_CLICK",
  ON_FILES_SELECTED = "ON_FILES_SELECTED",
  ON_HOVER = "ON_HOVER",
  ON_TOGGLE = "ON_TOGGLE",
  ON_LOAD = "ON_LOAD",
  ON_MODAL_CLOSE = "ON_MODAL_CLOSE",
  ON_TEXT_CHANGE = "ON_TEXT_CHANGE",
  ON_SUBMIT = "ON_SUBMIT",
  ON_CHECK_CHANGE = "ON_CHECK_CHANGE",
  ON_SWITCH_CHANGE = "ON_SWITCH_CHANGE",
  ON_SELECT = "ON_SELECT",
  ON_DATE_SELECTED = "ON_DATE_SELECTED",
  ON_DATE_RANGE_SELECTED = "ON_DATE_RANGE_SELECTED",
  ON_OPTION_CHANGE = "ON_OPTION_CHANGE",
  ON_MARKER_CLICK = "ON_MARKER_CLICK",
  ON_CREATE_MARKER = "ON_CREATE_MARKER",
  ON_TAB_CHANGE = "ON_TAB_CHANGE",
  ON_VIDEO_START = "ON_VIDEO_START",
  ON_VIDEO_END = "ON_VIDEO_END",
  ON_VIDEO_PLAY = "ON_VIDEO_PLAY",
  ON_VIDEO_PAUSE = "ON_VIDEO_PAUSE",
  ON_IFRAME_URL_CHANGED = "ON_IFRAME_URL_CHANGED",
  ON_IFRAME_MESSAGE_RECEIVED = "ON_IFRAME_MESSAGE_RECEIVED",
}

export type ActionType =
  | "API"
  | "QUERY"
  | "NAVIGATION"
  | "ALERT"
  | "JS_FUNCTION"
  | "SET_VALUE"
  | "DOWNLOAD";

export type DownloadFiletype = "CSV" | "XLS" | "JSON" | "TXT";

export interface PageAction {
  id: string;
  pluginType: PluginType;
  name: string;
  jsonPathKeys: string[];
  timeoutInMillisecond: number;
}

export interface ExecuteErrorPayload extends ErrorActionPayload {
  actionId: string;
  isPageLoad?: boolean;
  data: ActionResponse;
}

// Group 1 = datasource (https://www.domain.com)
// Group 2 = path (/nested/path)
// Group 3 = params (?param=123&param2=12)
export const urlGroupsRegexExp = /^(https?:\/{2}\S+?)(\/[\s\S]*?)(\?(?![^{]*})[\s\S]*)?$/;

export const EXECUTION_PARAM_KEY = "executionParams";
export const EXECUTION_PARAM_REFERENCE_REGEX = /this.params/g;

export const API_REQUEST_HEADERS: APIHeaders = {
  "Content-Type": "application/json",
};
export const POSTMAN = "POSTMAN";
export const CURL = "CURL";
export const Swagger = "Swagger";

export const defaultActionSettings: Record<PluginType, any> = {
  [PluginType.API]: apiActionSettingsConfig,
  [PluginType.DB]: queryActionSettingsConfig,
  [PluginType.SAAS]: saasActionSettingsConfig,
};

export const defaultActionEditorConfigs: Record<PluginType, any> = {
  [PluginType.API]: apiActionEditorConfig,
  [PluginType.DB]: [],
  [PluginType.SAAS]: [],
};

export const defaultActionDependenciesConfig: Record<
  PluginType,
  Record<string, string[]>
> = {
  [PluginType.API]: apiActionDependencyConfig,
  [PluginType.DB]: {},
  [PluginType.SAAS]: {},
};
