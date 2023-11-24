import type { AppState } from "@appsmith/reducers";

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
