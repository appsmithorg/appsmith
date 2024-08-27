/* eslint-disable @typescript-eslint/ban-types */
import type { ActionDescription } from "ee/entities/DataTree/actionTriggers";
import { ExecutionType } from "ee/workers/Evaluation/Actions";
import _ from "lodash";
import uniqueId from "lodash/uniqueId";
import type { NavigationTargetType_Dep } from "sagas/ActionExecution/NavigateActionSaga";

export type ActionDescriptionWithExecutionType = ActionDescription & {
  executionType: ExecutionType;
};

export type ActionDispatcherWithExecutionType = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => ActionDescriptionWithExecutionType;

export const PLATFORM_FUNCTIONS: Record<
  string,
  ActionDispatcherWithExecutionType
> = {
  navigateTo: function (
    pageNameOrUrl: string,
    params: Record<string, string>,
    target?: NavigationTargetType_Dep,
  ) {
    return {
      type: "NAVIGATE_TO",
      payload: { pageNameOrUrl, params, target },
      executionType: ExecutionType.PROMISE,
    };
  },
  showAlert: function (
    message: string,
    style: "info" | "success" | "warning" | "error" | "default",
  ) {
    return {
      type: "SHOW_ALERT",
      payload: { message, style },
      executionType: ExecutionType.PROMISE,
    };
  },
  showModal: function (modalName: string) {
    return {
      type: "SHOW_MODAL_BY_NAME",
      payload: { modalName },
      executionType: ExecutionType.PROMISE,
    };
  },
  closeModal: function (modalName: string) {
    return {
      type: "CLOSE_MODAL",
      payload: { modalName },
      executionType: ExecutionType.PROMISE,
    };
  },
  storeValue: function (key: string, value: string, persist = true) {
    // momentarily store this value in local state to support loops
    _.set(self, ["appsmith", "store", key], value);
    return {
      type: "STORE_VALUE",
      payload: {
        key,
        value,
        persist,
        uniqueActionRequestId: uniqueId("store_value_id_"),
      },
      executionType: ExecutionType.PROMISE,
    };
  },
  removeValue: function (key: string) {
    return {
      type: "REMOVE_VALUE",
      payload: { key },
      executionType: ExecutionType.PROMISE,
    };
  },
  clearStore: function () {
    return {
      type: "CLEAR_STORE",
      executionType: ExecutionType.PROMISE,
      payload: null,
    };
  },
  download: function (data: string, name: string, type: string) {
    return {
      type: "DOWNLOAD",
      payload: { data, name, type },
      executionType: ExecutionType.PROMISE,
    };
  },
  copyToClipboard: function (
    data: string,
    options?: { debug?: boolean; format?: string },
  ) {
    return {
      type: "COPY_TO_CLIPBOARD",
      payload: {
        data,
        options: { debug: options?.debug, format: options?.format },
      },
      executionType: ExecutionType.PROMISE,
    };
  },
  resetWidget: function (widgetName: string, resetChildren = true) {
    return {
      type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
      payload: { widgetName, resetChildren },
      executionType: ExecutionType.PROMISE,
    };
  },
  setInterval: function (callback: Function, interval: number, id?: string) {
    return {
      type: "SET_INTERVAL",
      payload: {
        callback: callback?.toString(),
        interval,
        id,
      },
      executionType: ExecutionType.TRIGGER,
    };
  },
  clearInterval: function (id: string) {
    return {
      type: "CLEAR_INTERVAL",
      payload: {
        id,
      },
      executionType: ExecutionType.TRIGGER,
    };
  },
  postWindowMessage: function (
    message: unknown,
    source: string,
    targetOrigin: string,
  ) {
    return {
      type: "POST_MESSAGE",
      payload: {
        message,
        source,
        targetOrigin,
      },
      executionType: ExecutionType.TRIGGER,
    };
  },
};
