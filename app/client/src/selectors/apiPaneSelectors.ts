import type { AppState } from "ee/reducers";
import { createSelector } from "reselect";
import { combinedPreviewModeSelector } from "./editorSelectors";

type GetFormData = (
  state: AppState,
  apiId: string,
) => { label: string; value: string };

export const getDisplayFormat: GetFormData = (state, apiId) => {
  const displayFormat = state.ui.apiPane.extraformData[apiId];

  return displayFormat;
};

export const getApiPaneConfigSelectedTabIndex = (state: AppState) =>
  state.ui.apiPane.selectedConfigTabIndex;

export const getApiRightPaneSelectedTab = (state: AppState) =>
  state.ui.apiPane.selectedRightPaneTab;

export const getIsRunning = (state: AppState, apiId: string) =>
  state.ui.apiPane.isRunning[apiId];

export const getApiPaneDebuggerState = (state: AppState) =>
  state.ui.apiPane.debugger;

export const showApiPaneDebugger = createSelector(
  (state) => state.ui.apiPane.debugger.open,
  combinedPreviewModeSelector,
  (isOpen, isPreview) => isOpen && !isPreview,
);
