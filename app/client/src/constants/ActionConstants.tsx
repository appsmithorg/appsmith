export type ExecuteActionPayload = {
  dynamicString: string;
  event: {
    type: EventType;
  };
  responseData?: any;
};

export enum EventType {
  ON_PAGE_LOAD = "ON_PAGE_LOAD",
  ON_PREV_PAGE = "ON_PREV_PAGE",
  ON_NEXT_PAGE = "ON_NEXT_PAGE",
  ON_ERROR = "ON_ERROR",
  ON_SUCCESS = "ON_SUCCESS",
  ON_ROW_SELECTED = "ON_ROW_SELECTED",
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
}

export interface ExecuteErrorPayload {
  actionId: string;
  error: any;
}
