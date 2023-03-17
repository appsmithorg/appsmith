import { AppState } from "@appsmith/reducers";

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

export const getApiPaneResponseSelectedTab = (state: AppState) =>
  state.ui.apiPane.selectedResponseTab;

export const getApiPaneResponsePaneHeight = (state: AppState) =>
  state.ui.apiPane.responseTabHeight;

export const getApiRightPaneSelectedTab = (state: AppState) =>
  state.ui.apiPane.selectedRightPaneTab;
