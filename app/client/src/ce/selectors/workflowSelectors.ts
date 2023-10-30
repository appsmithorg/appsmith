import type { AppState } from "@appsmith/reducers";
import type { WorkflowMetadata } from "@appsmith/constants/WorkflowConstants";

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
