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

export type TriggerSource = {
  id: string;
  name: string;
};

export type ExecuteTriggerPayload = {
  dynamicString: string;
  event: ExecuteActionPayloadEvent;
  responseData?: Array<any>;
  triggerPropertyName?: string;
  source?: TriggerSource;
  widgetId?: string;
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
  ON_FILTER_CHANGE = "ON_FILTER_CHANGE",
  ON_FILTER_UPDATE = "ON_FILTER_UPDATE",
  ON_MARKER_CLICK = "ON_MARKER_CLICK",
  ON_CREATE_MARKER = "ON_CREATE_MARKER",
  ON_TAB_CHANGE = "ON_TAB_CHANGE",
  ON_VIDEO_START = "ON_VIDEO_START",
  ON_VIDEO_END = "ON_VIDEO_END",
  ON_VIDEO_PLAY = "ON_VIDEO_PLAY",
  ON_VIDEO_PAUSE = "ON_VIDEO_PAUSE",
  ON_AUDIO_START = "ON_AUDIO_START",
  ON_AUDIO_END = "ON_AUDIO_END",
  ON_AUDIO_PLAY = "ON_AUDIO_PLAY",
  ON_AUDIO_PAUSE = "ON_AUDIO_PAUSE",
  ON_RATE_CHANGED = "ON_RATE_CHANGED",
  ON_IFRAME_URL_CHANGED = "ON_IFRAME_URL_CHANGED",
  ON_IFRAME_SRC_DOC_CHANGED = "ON_IFRAME_SRC_DOC_CHANGED",
  ON_IFRAME_MESSAGE_RECEIVED = "ON_IFRAME_MESSAGE_RECEIVED",
  ON_SNIPPET_EXECUTE = "ON_SNIPPET_EXECUTE",
  ON_SORT = "ON_SORT",
  ON_CHECKBOX_GROUP_SELECTION_CHANGE = "ON_CHECKBOX_GROUP_SELECTION_CHANGE",
  ON_LIST_PAGE_CHANGE = "ON_LIST_PAGE_CHANGE",
  ON_RECORDING_START = "ON_RECORDING_START",
  ON_RECORDING_COMPLETE = "ON_RECORDING_COMPLETE",
  ON_SWITCH_GROUP_SELECTION_CHANGE = "ON_SWITCH_GROUP_SELECTION_CHANGE",
  ON_JS_FUNCTION_EXECUTE = "ON_JS_FUNCTION_EXECUTE",
  ON_CAMERA_IMAGE_CAPTURE = "ON_CAMERA_IMAGE_CAPTURE",
  ON_CAMERA_IMAGE_SAVE = "ON_CAMERA_IMAGE_SAVE",
  ON_CAMERA_VIDEO_RECORDING_START = "ON_CAMERA_VIDEO_RECORDING_START",
  ON_CAMERA_VIDEO_RECORDING_STOP = "ON_CAMERA_VIDEO_RECORDING_STOP",
  ON_CAMERA_VIDEO_RECORDING_SAVE = "ON_CAMERA_VIDEO_RECORDING_SAVE",
}

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
export const urlGroupsRegexExp = /^(https?:\/{2}\S+?)(\/[\s\S]*?)?(\?(?![^{]*})[\s\S]*)?$/;

export const EXECUTION_PARAM_KEY = "executionParams";
export const EXECUTION_PARAM_REFERENCE_REGEX = /this.params|this\?.params/g;
export const THIS_DOT_PARAMS_KEY = "params";

export const RESP_HEADER_DATATYPE = "X-APPSMITH-DATATYPE";
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
  [PluginType.REMOTE]: saasActionSettingsConfig,
  [PluginType.JS]: [],
};

export const defaultActionEditorConfigs: Record<PluginType, any> = {
  [PluginType.API]: apiActionEditorConfig,
  [PluginType.DB]: [],
  [PluginType.SAAS]: [],
  [PluginType.REMOTE]: [],
  [PluginType.JS]: [],
};

export const defaultActionDependenciesConfig: Record<
  PluginType,
  Record<string, string[]>
> = {
  [PluginType.API]: apiActionDependencyConfig,
  [PluginType.DB]: {},
  [PluginType.SAAS]: {},
  [PluginType.REMOTE]: {},
  [PluginType.JS]: {},
};
