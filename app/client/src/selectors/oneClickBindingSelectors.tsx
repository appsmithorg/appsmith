import type { DefaultRootState } from "react-redux";

export const getOneClickBindingConfigForWidget =
  (widgetId: string) => (state: DefaultRootState) =>
    state.ui.oneClickBinding.config?.widgetId === widgetId
      ? state.ui.oneClickBinding.config
      : null;

export const getisOneClickBindingConnectingForWidget =
  (widgetId: string) => (state: DefaultRootState) =>
    state.ui.oneClickBinding.isConnecting &&
    state.ui.oneClickBinding.config?.widgetId === widgetId;

export const getIsOneClickBindingOptionsVisibility = (
  state: DefaultRootState,
) => state.ui.oneClickBinding.showOptions;
