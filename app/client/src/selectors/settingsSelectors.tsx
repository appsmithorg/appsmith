import { AppState } from "reducers";

export const getSettings = (state: AppState) => state.settings.config;

export const getSettingsLoadingState = (state: AppState) =>
  state.settings.isLoading;

export const getSettingsSavingState = (state: AppState) =>
  state.settings.isSaving;

export const getShowReleaseNotes = (state: AppState) =>
  state.settings.showReleaseNotes;

export const getRestartingState = (state: AppState) =>
  state.settings.isRestarting;

export const getIsRestartFailed = (state: AppState) =>
  state.settings.isRestartFailed;
