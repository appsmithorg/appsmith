import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface CreateWorkflowFromWorkspacePayload {
  workspaceId: string;
}

export interface FetchWorkflowPayload {
  workflowId: string;
}

export interface DeleteWorkflowPayload {
  id: string;
}

export interface InitWorkflowEditorPayload {
  workflowId: string;
}

export const fetchAllWorkflows = () => {
  return {
    type: ReduxActionTypes.FETCH_ALL_WORKFLOWS_INIT,
  };
};

export const fetchWorkflow = (payload: FetchWorkflowPayload) => ({
  type: ReduxActionTypes.FETCH_WORKFLOW_INIT,
  payload,
});

export const createWorkflowFromWorkspace = (
  payload: CreateWorkflowFromWorkspacePayload,
) => {
  return {
    type: ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_INIT,
    payload,
  };
};

export const setCurrentWorkflow = (id: string | null) => ({
  type: ReduxActionTypes.SET_CURRENT_WORKFLOW_ID,
  payload: { id },
});

export const initWorkflowEditor = (payload: InitWorkflowEditorPayload) => ({
  type: ReduxActionTypes.INITIALIZE_WORKFLOW_EDITOR,
  payload,
});

export const deleteWorkflow = (payload: DeleteWorkflowPayload) => {
  return {
    type: ReduxActionTypes.DELETE_WORKFLOW_INIT,
    payload,
  };
};

export const updateWorkflowName = (value: string, workflowId: string) => {
  return {
    type: ReduxActionTypes.UPDATE_WORKFLOW_NAME_INIT,
    payload: {
      id: workflowId,
      name: value,
    },
  };
};
