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
  responseData?: any;
};

export enum EventType {
  ON_RESET = "ON_RESET",
  ON_PAGE_LOAD = "ON_PAGE_LOAD",
  ON_PREV_PAGE = "ON_PREV_PAGE",
  ON_NEXT_PAGE = "ON_NEXT_PAGE",
  ON_ERROR = "ON_ERROR",
  ON_SUCCESS = "ON_SUCCESS",
  ON_ROW_SELECTED = "ON_ROW_SELECTED",
  ON_SEARCH = "ON_SEARCH",
  ON_CLICK = "ON_CLICK",
  ON_FILES_SELECTED = "ON_FILES_SELECTED",
  ON_HOVER = "ON_HOVER",
  ON_TOGGLE = "ON_TOGGLE",
  ON_LOAD = "ON_LOAD",
  ON_TEXT_CHANGE = "ON_TEXT_CHANGE",
  ON_SUBMIT = "ON_SUBMIT",
  ON_CHECK_CHANGE = "ON_CHECK_CHANGE",
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
  pluginType: ActionType;
  name: string;
  jsonPathKeys: string[];
  timeoutInMillisecond: number;
}

export interface ExecuteErrorPayload {
  actionId: string;
  error: any;
  isPageLoad?: boolean;
}

// Group 1 = datasource (https://www.domain.com)
// Group 2 = path (/nested/path)
// Group 3 = params (?param=123&param2=12)
export const urlGroupsRegexExp = /^(https?:\/{2}\S+?)(\/\S*?)(\?\S*)?$/;
