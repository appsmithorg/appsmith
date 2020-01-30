import { AlertType, MessageIntent } from "widgets/AlertWidget";
import { DropdownOption } from "widgets/DropdownWidget";

export type EventType =
  | "ON_CLICK"
  | "ON_HOVER"
  | "ON_TOGGLE"
  | "ON_LOAD"
  | "ON_TEXT_CHANGE"
  | "ON_SUBMIT"
  | "ON_CHECK_CHANGE"
  | "ON_SELECT"
  | "ON_DATE_SELECTED"
  | "ON_DATE_RANGE_SELECTED";

export type ActionType =
  | "API"
  | "QUERY"
  | "NAVIGATION"
  | "ALERT"
  | "JS_FUNCTION"
  | "SET_VALUE"
  | "DOWNLOAD";

export const PropertyPaneActionDropdownOptions: DropdownOption[] = [
  { label: "Call API", value: "API", id: "API" },
  // { label: "Run Query", value: "QUERY" },
];

export interface BaseActionPayload {
  actionId: string;
  actionType: ActionType;
  contextParams: Record<string, string>;
  onSuccess?: ActionPayload[];
  onError?: ActionPayload[];
}

export type ActionPayload =
  | NavigateActionPayload
  | SetValueActionPayload
  | ExecuteJSActionPayload
  | DownloadDataActionPayload
  | TableAction;

export type NavigationType = "NEW_TAB" | "INLINE";

export interface NavigateActionPayload extends BaseActionPayload {
  pageUrl: string;
  navigationType: NavigationType;
}

export interface ShowAlertActionPayload extends BaseActionPayload {
  header: string;
  message: string;
  alertType: AlertType;
  intent: MessageIntent;
}

export interface SetValueActionPayload extends BaseActionPayload {
  header: string;
  message: string;
  alertType: AlertType;
  intent: MessageIntent;
}

export interface ExecuteJSActionPayload extends BaseActionPayload {
  jsFunctionId: string;
  jsFunction: string;
}

export type DownloadFiletype = "CSV" | "XLS" | "JSON" | "TXT";

export interface DownloadDataActionPayload extends BaseActionPayload {
  data: JSON;
  fileName: string;
  fileType: DownloadFiletype;
}

export interface PageAction {
  id: string;
  pluginType: ActionType;
  name: string;
  jsonPathKeys: string[];
}

export interface TableAction extends BaseActionPayload {
  actionName: string;
}

export interface ExecuteErrorPayload {
  actionId: string;
  error: any;
}
