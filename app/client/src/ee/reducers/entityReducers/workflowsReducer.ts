import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { Workflow } from "@appsmith/constants/WorkflowConstants";
import type { FetchWorkflowResponse } from "@appsmith/api/WorkflowApi";

type ID = string;

export type WorkflowsReducerState = Record<ID, Workflow>;

const INITIAL_STATE: WorkflowsReducerState = {};

const workflowReducer = createImmerReducer(INITIAL_STATE, {
  [ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_SUCCESS]: (
    draftState: WorkflowsReducerState,
    action: ReduxAction<Workflow>,
  ) => {
    const { payload } = action;
    draftState[payload.id] = payload;

    return draftState;
  },
  [ReduxActionTypes.FETCH_WORKFLOW_SUCCESS]: (
    draftState: WorkflowsReducerState,
    action: ReduxAction<FetchWorkflowResponse>,
  ) => {
    // TODO (Workflows): Change to workflow structure once api is ready
    const { payload } = action;
    const workflow: Workflow = {
      ...payload.data,
    };

    const workflowId = payload.data.id;
    draftState[workflowId] = workflow;

    return draftState;
  },
  [ReduxActionTypes.UPDATE_WORKFLOW_NAME_SUCCESS]: (
    draftState: WorkflowsReducerState,
    action: ReduxAction<Workflow>,
  ) => {
    const workflowData = action.payload;
    draftState[workflowData.id] = {
      ...draftState[workflowData.id],
      name: workflowData.name,
      slug: action.payload.slug,
    };

    return draftState;
  },
});

export default workflowReducer;
