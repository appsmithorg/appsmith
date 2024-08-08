import type { ErrorActionPayload } from "sagas/ErrorSagas";
import type { ActionResponse } from "api/ActionAPI";
import { PluginType } from "entities/Action";
import queryActionSettingsConfig from "constants/AppsmithActionConstants/formConfig/QuerySettingsConfig";
import apiActionSettingsConfig from "constants/AppsmithActionConstants/formConfig/ApiSettingsConfig";
import apiActionEditorConfig from "constants/AppsmithActionConstants/formConfig/ApiEditorConfigs";
import saasActionSettingsConfig from "constants/AppsmithActionConstants/formConfig/GoogleSheetsSettingsConfig";
import apiActionDependencyConfig from "constants/AppsmithActionConstants/formConfig/ApiDependencyConfigs";
import apiActionDatasourceFormButtonConfig from "constants/AppsmithActionConstants/formConfig/ApiDatasourceFormsButtonConfig";
import type { EntityTypeValue } from "ee/entities/DataTree/types";

export interface ExecuteActionPayloadEvent {
  type: EventType;
  callback?: (result: ExecutionResult) => void;
}

export interface ExecutionResult {
  success: boolean;
}

export interface TriggerSource {
  id: string;
  name: string;
  entityType?: EntityTypeValue;
  collectionId?: string;
  isJSAction?: boolean;
  actionId?: string;
}
export enum TriggerKind {
  EVENT_EXECUTION = "EVENT_EXECUTION", // Eg. Button onClick
  JS_FUNCTION_EXECUTION = "JS_FUNCTION_EXECUTION", // Executing js function from jsObject page
}

export interface ExecuteTriggerPayload {
  dynamicString: string;
  event: ExecuteActionPayloadEvent;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callbackData?: Array<any>;
  triggerPropertyName?: string;
  source?: TriggerSource;
  widgetId?: string;
  globalContext?: Record<string, unknown>;
}

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
  ON_MODAL_SUBMIT = "ON_MODAL_SUBMIT",
  ON_TEXT_CHANGE = "ON_TEXT_CHANGE",
  ON_SUBMIT = "ON_SUBMIT",
  ON_CHECK_CHANGE = "ON_CHECK_CHANGE",
  ON_SWITCH_CHANGE = "ON_SWITCH_CHANGE",
  ON_SELECT = "ON_SELECT",
  ON_DATE_SELECTED = "ON_DATE_SELECTED",
  ON_DATE_RANGE_SELECTED = "ON_DATE_RANGE_SELECTED",
  ON_DROPDOWN_OPEN = "ON_DROPDOWN_OPEN",
  ON_DROPDOWN_CLOSE = "ON_DROPDOWN_CLOSE",
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
  ON_ENTER_KEY_PRESS = "ON_ENTER_KEY_PRESS",
  ON_BLUR = "ON_BLUR",
  ON_FOCUS = "ON_FOCUS",
  ON_BULK_SAVE = "ON_BULK_SAVE",
  ON_BULK_DISCARD = "ON_BULK_DISCARD",
  ON_ROW_SAVE = "ON_ROW_SAVE",
  ON_ROW_DISCARD = "ON_ROW_DISCARD",
  ON_CODE_DETECTED = "ON_CODE_DETECTED",
  ON_ADD_NEW_ROW_SAVE = "ON_ADD_NEW_ROW_SAVE",
  ON_ADD_NEW_ROW_DISCARD = "ON_ADD_NEW_ROW_DISCARD",
  CUSTOM_WIDGET_EVENT = "CUSTOM_WIDGET_EVENT",
}

export interface PageAction {
  id: string;
  pluginType: PluginType;
  name: string;
  jsonPathKeys: string[];
  timeoutInMillisecond: number;
  clientSideExecution?: boolean;
  collectionId?: string;
}

export interface ExecuteErrorPayload extends ErrorActionPayload {
  actionId: string;
  isPageLoad?: boolean;
  data: ActionResponse;
}

export interface LayoutOnLoadActionErrors {
  errorType: string;
  code: number;
  message: string;
}

// Group 1 = datasource (https://www.domain.com)
// Group 2 = path (/nested/path)
// Group 3 = params (?param=123&param2=12)
export const DATASOURCE_URL_EXACT_MATCH_REGEX =
  /^(https?:\/{2}\S+?)(\/[\s\S]*?)?(\?(?![^{]*})[\s\S]*)?$/;

export const EXECUTION_PARAM_KEY = "executionParams";
export const EXECUTION_PARAM_REFERENCE_REGEX = /this.params|this\?.params/g;
export const THIS_DOT_PARAMS_KEY = "$params";

export const RESP_HEADER_DATATYPE = "X-APPSMITH-DATATYPE";
export const API_REQUEST_HEADERS: APIHeaders = {
  "Content-Type": "application/json",
};
export const POSTMAN = "POSTMAN";
export const CURL = "CURL";
export const Swagger = "Swagger";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultActionSettings: Record<PluginType, any> = {
  [PluginType.API]: apiActionSettingsConfig,
  [PluginType.DB]: queryActionSettingsConfig,
  [PluginType.SAAS]: saasActionSettingsConfig,
  [PluginType.REMOTE]: saasActionSettingsConfig,
  [PluginType.JS]: [],
  [PluginType.AI]: saasActionSettingsConfig,
  [PluginType.INTERNAL]: saasActionSettingsConfig,
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultActionEditorConfigs: Record<PluginType, any> = {
  [PluginType.API]: apiActionEditorConfig,
  [PluginType.DB]: [],
  [PluginType.SAAS]: [],
  [PluginType.REMOTE]: [],
  [PluginType.JS]: [],
  [PluginType.AI]: [],
  [PluginType.INTERNAL]: [],
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
  [PluginType.AI]: {},
  [PluginType.INTERNAL]: {},
};

export const defaultDatasourceFormButtonConfig: Record<PluginType, string[]> = {
  [PluginType.API]: apiActionDatasourceFormButtonConfig.API,
  [PluginType.DB]: apiActionDatasourceFormButtonConfig.DB,
  [PluginType.SAAS]: apiActionDatasourceFormButtonConfig.SAAS,
  [PluginType.REMOTE]: apiActionDatasourceFormButtonConfig.REMOTE,
  [PluginType.JS]: [],
  [PluginType.AI]: apiActionDatasourceFormButtonConfig.AI,
  [PluginType.INTERNAL]: [],
};
