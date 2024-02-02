import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const toggleRunHistoryPane = (open: boolean) => ({
  type: open
    ? ReduxActionTypes.OPEN_WORKFLOW_RUN_HISTORY_PANE
    : ReduxActionTypes.CLOSE_WORKFLOW_RUN_HISTORY_PANE,
});

// set the selected tab in the run history pane.
export const setRunHistorySelectedTab = (selectedTab: string) => {
  return {
    type: ReduxActionTypes.SET_WORKFLOW_RUN_HISTORY_TAB,
    selectedTab,
  };
};

// set the height of the response pane in the run history pane.
export const setRunHistoryResponsePaneHeight = (height: number) => {
  return {
    type: ReduxActionTypes.SET_WORKFLOW_RUN_RESPONSE_PANE_HEIGHT,
    height,
  };
};

export const fetchWorkflowRunHistory = (workflowId: string, filter: string) => {
  return {
    type: ReduxActionTypes.FETCH_WORKFLOW_RUN_HISTORY_INIT,
    payload: {
      workflowId,
      filter,
    },
  };
};

export const fetchWorkflowRunHistoryDetails = (
  workflowId: string,
  runId: string,
) => {
  return {
    type: ReduxActionTypes.FETCH_WORKFLOW_RUN_HISTORY_DETAILS_INIT,
    payload: {
      workflowId,
      runId,
    },
  };
};
