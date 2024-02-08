import type { AppState } from "@appsmith/reducers";
import type { WorkflowMetadata } from "@appsmith/constants/WorkflowConstants";
import type { ActionData } from "@appsmith/reducers/entityReducers/actionsReducer";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";

const DEFAULT_WORKFLOW_LIST: WorkflowMetadata[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsFetchingWorkflows = (state: AppState) => false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsCreatingWorkflow = (state: AppState, workspaceId: string) =>
  false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getWorkflowsList = (state: AppState): WorkflowMetadata[] =>
  DEFAULT_WORKFLOW_LIST;

export const getIsCurrentEditorWorkflowType = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  state: AppState,
) => false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCurrentWorkflowActions = (state: AppState): ActionData[] => [];

export const getCurrentWorkflowJSActions = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  state: AppState,
): JSCollectionData[] => [];

export const getShowWorkflowFeature = () => false;
