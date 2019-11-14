import { AlertType, MessageIntent } from "../widgets/AlertWidget";
import { DropdownOption } from "../widgets/DropdownWidget";

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

export interface ActionPayload {
  actionId: string;
  actionType: ActionType;
  contextParams: Record<string, string>;
  onSuccess?: ActionPayload[];
  onError?: ActionPayload[];
}

export type NavigationType = "NEW_TAB" | "INLINE";

export interface NavigateActionPayload extends ActionPayload {
  pageUrl: string;
  navigationType: NavigationType;
}

export interface ShowAlertActionPayload extends ActionPayload {
  header: string;
  message: string;
  alertType: AlertType;
  intent: MessageIntent;
}

export interface SetValueActionPayload extends ActionPayload {
  header: string;
  message: string;
  alertType: AlertType;
  intent: MessageIntent;
}

export interface ExecuteJSActionPayload extends ActionPayload {
  jsFunctionId: string;
}

export type DownloadFiletype = "CSV" | "XLS" | "JSON" | "TXT";

export interface DownloadDataActionPayload extends ActionPayload {
  data: JSON;
  fileName: string;
  fileType: DownloadFiletype;
}

export interface PageAction {
  id: string;
  actionType: ActionType;
  name: string;
  jsonPathKeys?: string[];
}
