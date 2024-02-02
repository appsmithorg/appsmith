import type { AppState } from "@appsmith/reducers";

export const getShowRunHistoryPaneState = (state: AppState) =>
  state.ui.workflowHistoryPane.isOpen;

export const getRunHistorySelectedTab = (state: AppState) =>
  state.ui.workflowHistoryPane.context.selectedTab;

export const getRunHistoryResponsePaneHeight = (state: AppState) =>
  state.ui.workflowHistoryPane.context.responseTabHeight;

export const getRunHistoryLoadingState = (state: AppState) =>
  state.ui.workflowHistoryPane.workflowRunHistory.isLoading;

export const getRunHistoryData = (state: AppState) =>
  state.ui.workflowHistoryPane.workflowRunHistory.data;

export const getRunHistoryDetailsLoadingState = (state: AppState) =>
  state.ui.workflowHistoryPane.workflowRunDetails.isLoading;

export const getRunHistoryDetailsData = (state: AppState, runId: string) =>
  state.ui.workflowHistoryPane.workflowRunDetails.data.hasOwnProperty(runId)
    ? state.ui.workflowHistoryPane.workflowRunDetails.data[runId]
    : [];
