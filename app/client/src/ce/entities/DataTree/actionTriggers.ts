import { TPostWindowMessageDescription } from "workers/Evaluation/fns/postWindowMessage";
import { TCopyToClipboardDescription } from "workers/Evaluation/fns/copyToClipboard";
import {
  TClearDescription,
  TRunDescription,
} from "workers/Evaluation/fns/actionFns";
import { TNavigateToDescription } from "workers/Evaluation/fns/navigateTo";
import { TShowAlertDescription } from "workers/Evaluation/fns/showAlert";
import {
  TCloseModalDescription,
  TShowModalDescription,
} from "workers/Evaluation/fns/modalFns";
import { TResetWidgetDescription } from "workers/Evaluation/fns/resetWidget";
import {
  TGetGeoLocationDescription,
  TStopWatchGeoLocationDescription,
  TWatchGeoLocationDescription,
} from "workers/Evaluation/fns/geolocationFns";
import {
  TClearStoreDescription,
  TRemoveValueDescription,
  TStoreValueDescription,
} from "workers/Evaluation/fns/storeFns";
import { TDownloadDescription } from "workers/Evaluation/fns/download";

export type ActionTriggerKeys =
  | "RUN_PLUGIN_ACTION"
  | "CLEAR_PLUGIN_ACTION"
  | "NAVIGATE_TO"
  | "SHOW_ALERT"
  | "SHOW_MODAL_BY_NAME"
  | "CLOSE_MODAL"
  | "STORE_VALUE"
  | "REMOVE_VALUE"
  | "CLEAR_STORE"
  | "DOWNLOAD"
  | "COPY_TO_CLIPBOARD"
  | "RESET_WIDGET_META_RECURSIVE_BY_NAME"
  | "SET_INTERVAL"
  | "CLEAR_INTERVAL"
  | "GET_CURRENT_LOCATION"
  | "WATCH_CURRENT_LOCATION"
  | "STOP_WATCHING_CURRENT_LOCATION"
  | "POST_MESSAGE"
  | "SET_TIMEOUT"
  | "CLEAR_TIMEOUT";

export const ActionTriggerFunctionNames: Record<ActionTriggerKeys, string> = {
  CLEAR_INTERVAL: "clearInterval",
  CLEAR_PLUGIN_ACTION: "action.clear",
  CLOSE_MODAL: "closeModal",
  COPY_TO_CLIPBOARD: "copyToClipboard",
  DOWNLOAD: "download",
  NAVIGATE_TO: "navigateTo",
  RESET_WIDGET_META_RECURSIVE_BY_NAME: "resetWidget",
  RUN_PLUGIN_ACTION: "action.run",
  SET_INTERVAL: "setInterval",
  SHOW_ALERT: "showAlert",
  SHOW_MODAL_BY_NAME: "showModal",
  STORE_VALUE: "storeValue",
  REMOVE_VALUE: "removeValue",
  CLEAR_STORE: "clearStore",
  GET_CURRENT_LOCATION: "getCurrentLocation",
  WATCH_CURRENT_LOCATION: "watchLocation",
  STOP_WATCHING_CURRENT_LOCATION: "stopWatch",
  POST_MESSAGE: "postWindowMessage",
  SET_TIMEOUT: "setTimeout",
  CLEAR_TIMEOUT: "clearTimeout",
};

export type ActionDescription =
  | TRunDescription
  | TClearDescription
  | TNavigateToDescription
  | TShowAlertDescription
  | TShowModalDescription
  | TCloseModalDescription
  | TStoreValueDescription
  | TRemoveValueDescription
  | TClearStoreDescription
  | TDownloadDescription
  | TCopyToClipboardDescription
  | TResetWidgetDescription
  | TGetGeoLocationDescription
  | TWatchGeoLocationDescription
  | TStopWatchGeoLocationDescription
  | TPostWindowMessageDescription;
