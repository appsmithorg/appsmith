import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";
import { TypeOptions } from "react-toastify";

export enum ActionTriggerType {
  PROMISE = "PROMISE",
  RUN_PLUGIN_ACTION = "RUN_PLUGIN_ACTION",
  CLEAR_PLUGIN_ACTION = "CLEAR_PLUGIN_ACTION",
  NAVIGATE_TO = "NAVIGATE_TO",
  SHOW_ALERT = "SHOW_ALERT",
  SHOW_MODAL_BY_NAME = "SHOW_MODAL_BY_NAME",
  CLOSE_MODAL = "CLOSE_MODAL",
  STORE_VALUE = "STORE_VALUE",
  DOWNLOAD = "DOWNLOAD",
  COPY_TO_CLIPBOARD = "COPY_TO_CLIPBOARD",
  RESET_WIDGET_META_RECURSIVE_BY_NAME = "RESET_WIDGET_META_RECURSIVE_BY_NAME",
  SET_INTERVAL = "SET_INTERVAL",
  CLEAR_INTERVAL = "CLEAR_INTERVAL",
}

export type PromiseActionDescription = {
  type: ActionTriggerType.PROMISE;
  payload: {
    executor: ActionDescription[];
    then: string[];
    catch?: string;
    finally?: string;
  };
};

export type RunPluginActionDescription = {
  type: ActionTriggerType.RUN_PLUGIN_ACTION;
  payload: {
    actionId: string;
    params?: Record<string, unknown>;
  };
};

export type ClearPluginActionDescription = {
  type: ActionTriggerType.CLEAR_PLUGIN_ACTION;
  payload: {
    actionId: string;
  };
};

export type NavigateActionDescription = {
  type: ActionTriggerType.NAVIGATE_TO;
  payload: {
    pageNameOrUrl: string;
    params?: Record<string, string>;
    target?: NavigationTargetType;
  };
};

export type ShowAlertActionDescription = {
  type: ActionTriggerType.SHOW_ALERT;
  payload: {
    message: string | unknown;
    style?: TypeOptions;
  };
};

export type ShowModalActionDescription = {
  type: ActionTriggerType.SHOW_MODAL_BY_NAME;
  payload: { modalName: string };
};

export type CloseModalActionDescription = {
  type: ActionTriggerType.CLOSE_MODAL;
  payload: { modalName: string };
};

export type StoreValueActionDescription = {
  type: ActionTriggerType.STORE_VALUE;
  payload: {
    key: string;
    value: string;
    persist: boolean;
  };
};

export type DownloadActionDescription = {
  type: ActionTriggerType.DOWNLOAD;
  payload: {
    data: any;
    name: string;
    type: string;
  };
};

export type CopyToClipboardDescription = {
  type: ActionTriggerType.COPY_TO_CLIPBOARD;
  payload: {
    data: string;
    options: { debug?: boolean; format?: string };
  };
};

export type ResetWidgetDescription = {
  type: ActionTriggerType.RESET_WIDGET_META_RECURSIVE_BY_NAME;
  payload: {
    widgetName: string | unknown;
    resetChildren: boolean;
  };
};

export type SetIntervalDescription = {
  type: ActionTriggerType.SET_INTERVAL;
  payload: {
    callback: string;
    interval: number;
    id?: string;
  };
};

export type ClearIntervalDescription = {
  type: ActionTriggerType.CLEAR_INTERVAL;
  payload: {
    id: string;
  };
};

export type ActionDescription =
  | PromiseActionDescription
  | RunPluginActionDescription
  | ClearPluginActionDescription
  | NavigateActionDescription
  | ShowAlertActionDescription
  | ShowModalActionDescription
  | CloseModalActionDescription
  | StoreValueActionDescription
  | DownloadActionDescription
  | CopyToClipboardDescription
  | ResetWidgetDescription
  | SetIntervalDescription
  | ClearIntervalDescription;
