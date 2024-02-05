import type { AppState } from "@appsmith/reducers";

export const generateCdApiKeyLoadingSelector = (state: AppState) =>
  state.ui.gitExtended.generateCdApiKeyLoading;

export const cdApiKeySelector = (state: AppState) =>
  state.ui.gitExtended.cdApiKey;

export const toggleCdLoadingSelector = (state: AppState) =>
  state.ui.gitExtended.toggleCdLoading;

export const showDisableCdModalSelector = (state: AppState) => {
  return state.ui.gitExtended.showDisableCDModal;
};

export const showReconfigureCdKeyModalSelector = (state: AppState) => {
  return state.ui.gitExtended.showReconfigureCdKeyModal;
};

export const loadCdKeyOnMountSelector = (state: AppState) =>
  state.ui.gitExtended.loadCdKeyOnMount;
