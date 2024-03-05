import type {
  CreateWorkflowFromWorkspacePayload,
  DeleteWorkflowPayload,
  FetchWorkflowPayload,
  PublishWorkflowPayload,
} from "@appsmith/actions/workflowActions";
import {
  ReduxActionTypes,
  type ReduxAction,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { WorkflowMetadata } from "@appsmith/constants/WorkflowConstants";
import {
  DEFAULT_WORKFLOW_COLOR,
  DEFAULT_WORKFLOW_ICON,
  DEFAULT_WORKFLOW_PREFIX,
  type Workflow,
} from "@appsmith/constants/WorkflowConstants";

import {
  CREATE_WORKFLOW_ERROR,
  FETCH_WORKFLOW_ERROR,
} from "@appsmith/constants/messages";
import type { ApiResponse } from "api/ApiResponses";
import { createMessage } from "@appsmith/constants/messages";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import history from "utils/history";
import type {
  CreateWorkflowApiKeysResponse,
  CreateWorkflowPayload,
  FetchWorkflowResponse,
  FetchWorkflowRunDetailsResponse,
  FetchWorkflowRunsResponse,
  FetchWorkflowsResponse,
} from "@appsmith/api/WorkflowApi";
import WorkflowApi from "@appsmith/api/WorkflowApi";
import {
  getIsFetchingWorkflows,
  getShowWorkflowFeature,
  getWorkflowById,
  getWorkflowsList,
} from "@appsmith/selectors/workflowSelectors";
import { getNextEntityName } from "utils/AppsmithUtils";
import { workflowEditorURL } from "@appsmith/RouteBuilder";
import { toast } from "design-system";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { HistoryStateFilterStates } from "@appsmith/pages/Editor/WorkflowEditor/BottomBar/WorkflowRunHistory/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";

interface CreateWorkflowSagaProps {
  workspaceId: string;
  name?: string;
  icon?: string;
  color?: string;
}

/**
 * Saga creates a workflow and specifically should be called from workspace
 */
export function* createWorkflowFromWorkspaceSaga(
  action: ReduxAction<CreateWorkflowFromWorkspacePayload>,
) {
  try {
    const { workspaceId } = action.payload;
    const isFetchingWorkflowsList: boolean = yield select(
      getIsFetchingWorkflows,
    );

    if (isFetchingWorkflowsList) return;

    const response: ApiResponse<Workflow> = yield call(createWorkflowSaga, {
      workspaceId,
    });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const workflowId = response.data.id;

      yield put({
        type: ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_SUCCESS,
        payload: response.data,
      });

      AnalyticsUtil.logEvent("CREATE_WORKFLOW", { workflowId });
      history.push(workflowEditorURL({ workflowId }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_WORKFLOW_FROM_WORKSPACE_ERROR,
      payload: {
        error: {
          message: createMessage(CREATE_WORKFLOW_ERROR),
        },
      },
    });
  }
}

/**
 * Creates a workflow based on the workspaceId provided. name, icon and color are optional, so if
 * they are not provided; the saga will auto generate them.
 * For name, the saga will will look into existing workflows in the workspace and generate the next
 * possible name.
 *
 * @param payload - createWorkflowSaga
 *  {
      workspaceId: string;
      name?: string;
      icon?: string;
      color?: string;
    }
 * @returns
 */
export function* createWorkflowSaga(payload: CreateWorkflowSagaProps) {
  try {
    const workflowList: WorkflowMetadata[] = yield select(getWorkflowsList);

    const name = (() => {
      if (payload.name) return payload.name;

      const currentWorkspaceWorkflows = workflowList
        .filter(({ workspaceId }) => workspaceId === payload.workspaceId)
        .map(({ name }) => name);

      return getNextEntityName(
        DEFAULT_WORKFLOW_PREFIX,
        currentWorkspaceWorkflows,
      );
    })();

    const body: CreateWorkflowPayload = {
      workspaceId: payload.workspaceId,
      name,
      icon: payload.icon || DEFAULT_WORKFLOW_ICON,
      color: payload.color || DEFAULT_WORKFLOW_COLOR,
    };

    const response: ApiResponse = yield call(WorkflowApi.createWorkflow, body);

    return response;
  } catch (error) {
    throw error;
  }
}

export function* fetchWorkflowSaga(payload: FetchWorkflowPayload) {
  try {
    const response: FetchWorkflowResponse = yield call(
      WorkflowApi.fetchWorkflowById,
      payload,
    );
    const isValidResponse: boolean = yield call(validateResponse, response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_WORKFLOW_SUCCESS,
        payload: response,
      });
    }

    return response;
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_WORKFLOW_ERROR,
      payload: {
        error: {
          message: createMessage(FETCH_WORKFLOW_ERROR),
        },
      },
    });
  }
}

export function* fetchWorkflowsForWorkspaceSaga(action?: ReduxAction<string>) {
  try {
    const showWorkflowFeature: boolean = yield select(getShowWorkflowFeature);
    if (!showWorkflowFeature) return;
    let activeWorkspaceId: string = "";
    if (!action?.payload) {
      activeWorkspaceId = yield select(getCurrentWorkspaceId);
    } else {
      activeWorkspaceId = action.payload;
    }

    const response: FetchWorkflowsResponse = yield call(
      WorkflowApi.fetchWorkflows,
      { workspaceId: activeWorkspaceId },
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ALL_WORKFLOWS_FOR_WORKSPACE_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_ALL_WORKFLOWS_FOR_WORKSPACE_ERROR,
        payload: {
          error: {
            message: createMessage(FETCH_WORKFLOW_ERROR),
          },
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ALL_WORKFLOWS_FOR_WORKSPACE_ERROR,
      payload: {
        error: {
          message: createMessage(FETCH_WORKFLOW_ERROR),
        },
      },
    });
  }
}

export function* deleteWorkflowSaga(
  action: ReduxAction<DeleteWorkflowPayload>,
) {
  try {
    const response: ApiResponse<Workflow> = yield call(
      WorkflowApi.deleteWorkflow,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_WORKFLOW_SUCCESS,
        payload: action.payload,
      });
      AnalyticsUtil.logEvent("DELETE_WORKFLOW", {
        workflowId: action.payload.id,
      });
      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_WORKFLOW_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* updateWorkflowNameSaga(
  action: ReduxAction<Partial<Workflow>>,
) {
  try {
    const workflowId = action.payload.id;
    const workflow: WorkflowMetadata = yield select(
      getWorkflowById,
      workflowId || "",
    );
    const response: ApiResponse<Workflow> = yield call(
      WorkflowApi.updateWorkflow,
      { ...workflow, name: action.payload.name || "" },
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_WORKFLOW_NAME_SUCCESS,
        payload: response.data,
      });

      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_WORKFLOW_NAME_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* publishWorkflowSaga(
  action: ReduxAction<PublishWorkflowPayload>,
) {
  try {
    const response: ApiResponse<PublishWorkflowPayload> = yield call(
      WorkflowApi.publishWorkflow,
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.PUBLISH_WORKFLOW_SUCCESS,
        payload: response.data,
      });

      AnalyticsUtil.logEvent("DEPLOY_WORKFLOW", {
        workflowId: action.payload.workflowId,
      });

      toast.show("Workflow published successfully", { kind: "success" });

      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.PUBLISH_WORKFLOW_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* toggleWorkflowTokenSaga(
  action: ReduxAction<{
    workflowId: string;
    isTokenCurrentlyGenerated: boolean;
  }>,
) {
  try {
    const { isTokenCurrentlyGenerated, workflowId } = action.payload;
    let response: CreateWorkflowApiKeysResponse;
    if (!isTokenCurrentlyGenerated) {
      response = yield call(WorkflowApi.createWorkflowApiKey, workflowId);
    } else {
      response = yield call(WorkflowApi.archiveWorkflowApiKey, workflowId);
    }
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const type = isTokenCurrentlyGenerated
        ? ReduxActionTypes.DELETE_WORKFLOW_TOKEN_SUCCESS
        : ReduxActionTypes.CREATE_WORKFLOW_TOKEN_SUCCESS;
      yield put({
        type,
        payload: { token: response.data, workflowId },
      });

      return response.data;
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.TOGGLE_WORKFLOW_TOKEN_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchWorkflowRunHistorySaga(
  action: ReduxAction<{
    workflowId: string;
    filter: string;
  }>,
) {
  try {
    const { filter, workflowId } = action.payload;

    const statusFilter =
      filter === HistoryStateFilterStates.ALL_RUNS ? "" : filter;
    const paramString = statusFilter.length > 0 ? "?status=FAILED" : "";
    const response: ApiResponse<FetchWorkflowRunsResponse> = yield call(
      WorkflowApi.fetchWorkflowRuns,
      workflowId,
      paramString,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const { data } = response;
      yield put({
        type: ReduxActionTypes.FETCH_WORKFLOW_RUN_HISTORY_SUCCESS,
        payload: data.runs,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_WORKFLOW_RUN_HISTORY_ERROR,
        payload: {
          error: response.responseMeta.error,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_WORKFLOW_RUN_HISTORY_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchWorkflowRunHistoryDetailsSaga(
  action: ReduxAction<{
    workflowId: string;
    runId: string;
  }>,
) {
  try {
    const { runId, workflowId } = action.payload;

    const response: ApiResponse<FetchWorkflowRunDetailsResponse> = yield call(
      WorkflowApi.fetchWorkflowRunDetails,
      workflowId,
      runId,
    );
    // const isValidResponse: boolean = yield validateResponse(response);
    const isValidResponse = true;

    if (isValidResponse) {
      const { data } = response;
      yield put({
        type: ReduxActionTypes.FETCH_WORKFLOW_RUN_HISTORY_DETAILS_SUCCESS,
        payload: { [runId]: data.activities },
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_WORKFLOW_RUN_HISTORY_DETAILS_ERROR,
        payload: {
          error: response.responseMeta.error,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_WORKFLOW_RUN_HISTORY_DETAILS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* workflowsSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_ALL_WORKFLOWS_FOR_WORKSPACE_INIT,
      fetchWorkflowsForWorkspaceSaga,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_WORKFLOW_FROM_WORKSPACE_INIT,
      createWorkflowFromWorkspaceSaga,
    ),
    takeLatest(ReduxActionTypes.DELETE_WORKFLOW_INIT, deleteWorkflowSaga),
    takeLatest(
      ReduxActionTypes.UPDATE_WORKFLOW_NAME_INIT,
      updateWorkflowNameSaga,
    ),
    takeLatest(ReduxActionTypes.PUBLISH_WORKFLOW_INIT, publishWorkflowSaga),
    takeLatest(ReduxActionTypes.TOGGLE_WORKFLOW_TOKEN, toggleWorkflowTokenSaga),
    takeLatest(
      ReduxActionTypes.FETCH_WORKFLOW_RUN_HISTORY_INIT,
      fetchWorkflowRunHistorySaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_WORKFLOW_RUN_HISTORY_DETAILS_INIT,
      fetchWorkflowRunHistoryDetailsSaga,
    ),
  ]);
}
