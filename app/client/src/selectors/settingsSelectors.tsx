import type { DefaultRootState } from "react-redux";

export const getSettings = (state: DefaultRootState) => state.settings.config;

export const getSettingsLoadingState = (state: DefaultRootState) =>
  state.settings.isLoading;

export const getSettingsSavingState = (state: DefaultRootState) =>
  state.settings.isSaving;

export const getShowReleaseNotes = (state: DefaultRootState) =>
  state.settings.showReleaseNotes;

export const getRestartingState = (state: DefaultRootState) =>
  state.settings.isRestarting;

export const getIsRestartFailed = (state: DefaultRootState) =>
  state.settings.isRestartFailed;
