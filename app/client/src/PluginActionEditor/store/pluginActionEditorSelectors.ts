import type { AppState } from "ee/reducers";
import { createSelector } from "reselect";

import { POST_BODY_FORM_DATA_KEY } from "../constants";

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

export const getActionIsRunning = (id: string) =>
  createSelector(
    [getActionRunningState],
    (isRunningMap) => id in isRunningMap && isRunningMap[id],
  );

const getActionDeletingState = (state: AppState) =>
  state.ui.pluginActionEditor.isDeleting;

export const getActionIsDeleting = (id: string) =>
  createSelector(
    [getActionDeletingState],
    (deletingMap) => id in deletingMap && deletingMap[id],
  );

type GetFormData = (
  state: AppState,
  id: string,
) => { label: string; value: string } | undefined;

export const getPostBodyFormat: GetFormData = (state, id) => {
  const formData = state.ui.pluginActionEditor.formData;

  if (id in formData) {
    return formData[id][POST_BODY_FORM_DATA_KEY];
  }

  return undefined;
};
export const getPluginActionConfigSelectedTab = (state: AppState) =>
  state.ui.pluginActionEditor.selectedConfigTab;

export const getPluginActionDebuggerState = (state: AppState) =>
  state.ui.pluginActionEditor.debugger;

export const isPluginActionCreating = (state: AppState) =>
  state.ui.pluginActionEditor.isCreating;
