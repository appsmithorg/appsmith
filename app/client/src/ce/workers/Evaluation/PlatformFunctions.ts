import { ActionDispatcher } from "entities/DataTree/types";
import { klona } from "klona/lite";
import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";
import { promisifyAction } from "workers/Evaluation/fns/utils/PromisifyAction";

export const PLATFORM_FUNCTIONS: Record<string, ActionDispatcher> = {
  navigateTo: function(
    pageNameOrUrl: string,
    params: Record<string, string>,
    target?: NavigationTargetType,
  ) {
    return {
      type: "NAVIGATE_TO",
      payload: { pageNameOrUrl, params, target },
    };
  },
  showAlert: function(
    message: string,
    style: "info" | "success" | "warning" | "error" | "default",
  ) {
    return {
      type: "SHOW_ALERT",
      payload: { message, style },
    };
  },
  showModal: function(modalName: string) {
    return {
      type: "SHOW_MODAL_BY_NAME",
      payload: { modalName },
    };
  },
  closeModal: function(modalName: string) {
    return {
      type: "CLOSE_MODAL",
      payload: { modalName },
    };
  },
  download: function(data: string, name: string, type: string) {
    return {
      type: "DOWNLOAD",
      payload: { data, name, type },
    };
  },
  copyToClipboard: function(
    data: string,
    options?: { debug?: boolean; format?: string },
  ) {
    return {
      type: "COPY_TO_CLIPBOARD",
      payload: {
        data,
        options: { debug: options?.debug, format: options?.format },
      },
    };
  },
  resetWidget: function(widgetName: string, resetChildren = true) {
    return {
      type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
      payload: { widgetName, resetChildren },
    };
  },
  postWindowMessage: function(
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
    };
  },
};

export function promisifiedFnFactory(fn: ActionDispatcher) {
  const metaData = klona(self["$metaData"]);
  return (...args: any[]) => {
    const actionDescription = fn(...args);
    return promisifyAction(actionDescription, metaData);
  };
}
