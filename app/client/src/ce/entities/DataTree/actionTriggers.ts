import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";
import { TypeOptions } from "react-toastify";

const ActionTriggerType = {
  RUN_PLUGIN_ACTION: "RUN_PLUGIN_ACTION",
  CLEAR_PLUGIN_ACTION: "CLEAR_PLUGIN_ACTION",
  NAVIGATE_TO: "NAVIGATE_TO",
  SHOW_ALERT: "SHOW_ALERT",
  SHOW_MODAL_BY_NAME: "SHOW_MODAL_BY_NAME",
  CLOSE_MODAL: "CLOSE_MODAL",
  STORE_VALUE: "STORE_VALUE",
  REMOVE_VALUE: "REMOVE_VALUE",
  CLEAR_STORE: "CLEAR_STORE",
  DOWNLOAD: "DOWNLOAD",
  COPY_TO_CLIPBOARD: "COPY_TO_CLIPBOARD",
  RESET_WIDGET_META_RECURSIVE_BY_NAME: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
  SET_INTERVAL: "SET_INTERVAL",
  CLEAR_INTERVAL: "CLEAR_INTERVAL",
  GET_CURRENT_LOCATION: "GET_CURRENT_LOCATION",
  WATCH_CURRENT_LOCATION: "WATCH_CURRENT_LOCATION",
  STOP_WATCHING_CURRENT_LOCATION: "STOP_WATCHING_CURRENT_LOCATION",
  CONFIRMATION_MODAL: "CONFIRMATION_MODAL",
  POST_MESSAGE: "POST_MESSAGE",
  SET_TIMEOUT: "SET_TIMEOUT",
  CLEAR_TIMEOUT: "CLEAR_TIMEOUT",
};

export type ActionTriggerKeys = keyof typeof ActionTriggerType;

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
  CONFIRMATION_MODAL: "ConfirmationModal",
  POST_MESSAGE: "postWindowMessage",
  SET_TIMEOUT: "setTimeout",
  CLEAR_TIMEOUT: "clearTimeout",
};

interface ActionDescriptionInterface<T> {
  type: ActionTriggerKeys;
  payload: T;
}

export type RunPluginActionDescription = ActionDescriptionInterface<{
  actionId: string;
  params?: Record<string, unknown>;
  onSuccess?: string;
  onError?: string;
}>;

export type ClearPluginActionDescription = ActionDescriptionInterface<{
  actionId: string;
}>;

export type NavigateActionDescription = ActionDescriptionInterface<{
  pageNameOrUrl: string;
  params?: Record<string, string>;
  target?: NavigationTargetType;
}>;

export type ShowAlertActionDescription = ActionDescriptionInterface<{
  message: string | unknown;
  style?: TypeOptions;
}>;

export type ShowModalActionDescription = ActionDescriptionInterface<{
  modalName: string;
}>;

export type CloseModalActionDescription = ActionDescriptionInterface<{
  modalName: string;
}>;

export type StoreValueActionDescription = ActionDescriptionInterface<{
  key: string;
  value: string;
  persist: boolean;
  uniqueActionRequestId: string;
}>;

export type RemoveValueActionDescription = ActionDescriptionInterface<{
  key: string;
}>;

export type ClearStoreActionDescription = ActionDescriptionInterface<null>;

export type DownloadActionDescription = ActionDescriptionInterface<{
  data: any;
  name: string;
  type: string;
}>;

export type CopyToClipboardDescription = ActionDescriptionInterface<{
  data: string;
  options: { debug?: boolean; format?: string };
}>;

export type ResetWidgetDescription = ActionDescriptionInterface<{
  widgetName: string;
  resetChildren: boolean;
}>;

export type SetIntervalDescription = ActionDescriptionInterface<{
  callback: string;
  interval: number;
  id?: string;
}>;

export type ClearIntervalDescription = ActionDescriptionInterface<{
  id: string;
}>;

type GeolocationOptions = {
  maximumAge?: number;
  timeout?: number;
  enableHighAccuracy?: boolean;
};

type GeolocationPayload = {
  onSuccess?: string;
  onError?: string;
  options?: GeolocationOptions;
};

export type GetCurrentLocationDescription = ActionDescriptionInterface<
  GeolocationPayload
>;

export type WatchCurrentLocationDescription = ActionDescriptionInterface<
  GeolocationPayload
>;

export type StopWatchingCurrentLocationDescription = ActionDescriptionInterface<
  Record<string, never> | undefined
>;

export type ConfirmationModalDescription = ActionDescriptionInterface<
  Record<string, any> | undefined
>;

export type PostMessageDescription = ActionDescriptionInterface<{
  message: unknown;
  source: string;
  targetOrigin: string;
}>;

export type ActionDescription = ActionDescriptionInterface<unknown>;
