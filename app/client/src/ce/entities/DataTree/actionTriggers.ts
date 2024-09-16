import type { NavigationTargetType_Dep } from "sagas/ActionExecution/NavigateActionSaga";
import type { TypeOptions } from "react-toastify";

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
  | "CONFIRMATION_MODAL"
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
  CONFIRMATION_MODAL: "ConfirmationModal",
  POST_MESSAGE: "postWindowMessage",
  SET_TIMEOUT: "setTimeout",
  CLEAR_TIMEOUT: "clearTimeout",
};

export interface ActionDescriptionInterface<T, Type extends ActionTriggerKeys> {
  type: Type;
  payload: T;
}

export type RunPluginActionDescription = ActionDescriptionInterface<
  {
    actionId: string;
    params?: Record<string, unknown>;
    onSuccess?: string;
    onError?: string;
  },
  "RUN_PLUGIN_ACTION"
>;

export type ClearPluginActionDescription = ActionDescriptionInterface<
  {
    actionId: string;
  },
  "CLEAR_PLUGIN_ACTION"
>;

export type NavigateActionDescription = ActionDescriptionInterface<
  {
    pageNameOrUrl: string;
    params?: Record<string, string>;
    target?: NavigationTargetType_Dep;
  },
  "NAVIGATE_TO"
>;

export type ShowAlertActionDescription = ActionDescriptionInterface<
  {
    message: string | unknown;
    style?: TypeOptions;
  },
  "SHOW_ALERT"
>;

export type ShowModalActionDescription = ActionDescriptionInterface<
  {
    modalName: string;
  },
  "SHOW_MODAL_BY_NAME"
>;

export type CloseModalActionDescription = ActionDescriptionInterface<
  {
    modalName: string;
  },
  "CLOSE_MODAL"
>;

export type StoreValueActionDescription = ActionDescriptionInterface<
  {
    key: string;
    value: string;
    persist: boolean;
  },
  "STORE_VALUE"
>;

export type RemoveValueActionDescription = ActionDescriptionInterface<
  {
    key: string;
  },
  "REMOVE_VALUE"
>;

export type ClearStoreActionDescription = ActionDescriptionInterface<
  null,
  "CLEAR_STORE"
>;

export type DownloadActionDescription = ActionDescriptionInterface<
  {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    name: string;
    type: string;
  },
  "DOWNLOAD"
>;

export type CopyToClipboardDescription = ActionDescriptionInterface<
  {
    data: string;
    options: { debug?: boolean; format?: string };
  },
  "COPY_TO_CLIPBOARD"
>;

export type ResetWidgetDescription = ActionDescriptionInterface<
  {
    widgetName: string;
    resetChildren: boolean;
  },
  "RESET_WIDGET_META_RECURSIVE_BY_NAME"
>;

export type SetIntervalDescription = ActionDescriptionInterface<
  {
    callback: string;
    interval: number;
    id?: string;
  },
  "SET_INTERVAL"
>;

export type ClearIntervalDescription = ActionDescriptionInterface<
  {
    id: string;
  },
  "CLEAR_INTERVAL"
>;

interface GeolocationOptions {
  maximumAge?: number;
  timeout?: number;
  enableHighAccuracy?: boolean;
}

interface GeolocationPayload {
  onSuccess?: string;
  onError?: string;
  options?: GeolocationOptions;
}

export type GetCurrentLocationDescription = ActionDescriptionInterface<
  GeolocationPayload,
  "GET_CURRENT_LOCATION"
>;

export type WatchCurrentLocationDescription = ActionDescriptionInterface<
  GeolocationPayload,
  "WATCH_CURRENT_LOCATION"
>;

export type StopWatchingCurrentLocationDescription = ActionDescriptionInterface<
  Record<string, never> | undefined,
  "STOP_WATCHING_CURRENT_LOCATION"
>;

export type ConfirmationModalDescription = ActionDescriptionInterface<
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<string, any> | undefined,
  "CONFIRMATION_MODAL"
>;

export type PostMessageDescription = ActionDescriptionInterface<
  {
    message: unknown;
    source: string;
    targetOrigin: string;
  },
  "POST_MESSAGE"
>;

export type ActionDescription =
  | RunPluginActionDescription
  | ClearPluginActionDescription
  | NavigateActionDescription
  | ShowAlertActionDescription
  | ShowModalActionDescription
  | CloseModalActionDescription
  | StoreValueActionDescription
  | RemoveValueActionDescription
  | ClearStoreActionDescription
  | DownloadActionDescription
  | CopyToClipboardDescription
  | ResetWidgetDescription
  | SetIntervalDescription
  | ClearIntervalDescription
  | GetCurrentLocationDescription
  | WatchCurrentLocationDescription
  | StopWatchingCurrentLocationDescription
  | ConfirmationModalDescription
  | PostMessageDescription;
