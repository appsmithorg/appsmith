import type { DefaultRootState } from "react-redux";
import type { WorkflowMetadata } from "ee/constants/WorkflowConstants";
import type { ActionData } from "ee/reducers/entityReducers/actionsReducer";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";

const DEFAULT_WORKFLOW_LIST: WorkflowMetadata[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsFetchingWorkflows = (state: DefaultRootState) => false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsCreatingWorkflow = () => false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getWorkflowsList = (state: DefaultRootState): WorkflowMetadata[] =>
  DEFAULT_WORKFLOW_LIST;

export const getIsCurrentEditorWorkflowType = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  state: DefaultRootState,
) => false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getCurrentWorkflowActions = (): ActionData[] => [];

export const getCurrentWorkflowJSActions = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  state: DefaultRootState,
): JSCollectionData[] => [];

export const getShowWorkflowFeature = () => false;
