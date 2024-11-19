import type { AppState } from "ee/reducers";
import { createSelector } from "reselect";

import { POST_BODY_FORM_DATA_KEY } from "./constants";
import { POST_BODY_FORMAT_OPTIONS } from "../constants/CommonApiConstants";

export const getActionEditorSavingMap = (state: AppState) =>
  state.ui.pluginActionEditor.isSaving;

export const isActionSaving = (id: string) =>
  createSelector([getActionEditorSavingMap], (savingMap) => {
    return id in savingMap && savingMap[id];
  });

const getActionDirtyState = (state: AppState) =>
  state.ui.pluginActionEditor.isDirty;

export const isActionDirty = (id: string) =>
  createSelector([getActionDirtyState], (actionDirtyMap) => {
    return id in actionDirtyMap && actionDirtyMap[id];
  });

const getActionRunningState = (state: AppState) =>
  state.ui.pluginActionEditor.isRunning;

export const isActionRunning = (id: string) =>
  createSelector(
    [getActionRunningState],
    (isRunningMap) => id in isRunningMap && isRunningMap[id],
  );

const getActionDeletingState = (state: AppState) =>
  state.ui.pluginActionEditor.isDeleting;

export const isActionDeleting = (id: string) =>
  createSelector(
    [getActionDeletingState],
    (deletingMap) => id in deletingMap && deletingMap[id],
  );

export const getFormData = (state: AppState) =>
  state.ui.pluginActionEditor.formData;

type GetFormPostBodyFormat = (state: AppState) => {
  label: string;
  value: string;
};

export const getPostBodyFormat: GetFormPostBodyFormat = (state) => {
  const formData = getFormData(state);

  if (POST_BODY_FORM_DATA_KEY in formData) {
    return formData[POST_BODY_FORM_DATA_KEY];
  }

  return {
    label: POST_BODY_FORMAT_OPTIONS.NONE,
    value: POST_BODY_FORMAT_OPTIONS.NONE,
  };
};
export const getPluginActionConfigSelectedTab = (state: AppState) =>
  state.ui.pluginActionEditor.selectedConfigTab;

export const getPluginActionDebuggerState = (state: AppState) =>
  state.ui.pluginActionEditor.debugger;

export const isPluginActionCreating = (state: AppState) =>
  state.ui.pluginActionEditor.isCreating;

export const isPluginActionSettingsOpen = (state: AppState) =>
  state.ui.pluginActionEditor.settingsOpen;
