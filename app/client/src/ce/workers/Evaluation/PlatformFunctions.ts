import { NavigationTargetType } from "sagas/ActionExecution/NavigateActionSaga";
import { ActionDispatcherWithExecutionType, ExecutionType } from "./Actions";

export const PLATFORM_FUNCTIONS: Record<
  string,
  ActionDispatcherWithExecutionType
> = {
  navigateTo: function(
    pageNameOrUrl: string,
    params: Record<string, string>,
    target?: NavigationTargetType,
  ) {
    return {
      type: "NAVIGATE_TO",
      payload: { pageNameOrUrl, params, target },
      executionType: ExecutionType.PROMISE,
    };
  },
  showAlert: function(
    message: string,
    style: "info" | "success" | "warning" | "error" | "default",
  ) {
    return {
      type: "SHOW_ALERT",
      payload: { message, style },
      executionType: ExecutionType.PROMISE,
    };
  },
  showModal: function(modalName: string) {
    return {
      type: "SHOW_MODAL_BY_NAME",
      payload: { modalName },
      executionType: ExecutionType.PROMISE,
    };
  },
  closeModal: function(modalName: string) {
    return {
      type: "CLOSE_MODAL",
      payload: { modalName },
      executionType: ExecutionType.PROMISE,
    };
  },
  download: function(data: string, name: string, type: string) {
    return {
      type: "DOWNLOAD",
      payload: { data, name, type },
      executionType: ExecutionType.PROMISE,
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
      executionType: ExecutionType.PROMISE,
    };
  },
  resetWidget: function(widgetName: string, resetChildren = true) {
    return {
      type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
      payload: { widgetName, resetChildren },
      executionType: ExecutionType.PROMISE,
    };
  },
};
