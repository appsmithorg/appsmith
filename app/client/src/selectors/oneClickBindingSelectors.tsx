import type { AppState } from "ce/reducers";

export const getOneClickBindingConfigForWidget =
  (widgetId: string) => (state: AppState) =>
    state.ui.oneClickBinding.config?.widgetId === widgetId
      ? state.ui.oneClickBinding.config
      : null;

export const getisOneClickBindingConnectingForWidget =
  (widgetId: string) => (state: AppState) =>
    state.ui.oneClickBinding.isConnecting &&
    state.ui.oneClickBinding.config?.widgetId === widgetId;
