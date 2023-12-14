import type {
  CreateWorkflowFromWorkspacePayload,
  DeleteWorkflowPayload,
  FetchWorkflowPayload,
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
  CreateWorkflowPayload,
  FetchWorkflowResponse,
} from "@appsmith/api/WorkflowApi";
import WorkflowApi from "@appsmith/api/WorkflowApi";
import {
  getIsFetchingWorkflows,
  getShowWorkflowFeature,
  getWorkflowById,
  getWorkflowsList,
} from "@appsmith/selectors/workflowSelectors";
import { getWorkspaces } from "ce/selectors/workspaceSelectors";
import { getNextEntityName } from "utils/AppsmithUtils";
import { workflowEditorURL } from "@appsmith/RouteBuilder";
import type { Workspaces } from "@appsmith/constants/workspaceConstants";

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

      //TODO (Workflows): Add back once we get the workflow JS object api
      // yield fetchPluginsSaga(fetchPlugins({ workspaceId }));
      // yield put(createNewJSCollection(pageId, "WORKFLOW_CREATION", "workflow"));

      // history.push(`${BASE_WORKFLOW_EDITOR_URL}/${workflowId}/edit`);
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

export function* fetchAllWorkflowsSaga() {
  try {
    // TODO (Workflows): Remove and add call without workspaceId
    const showWorkflowFeature: boolean = yield select(getShowWorkflowFeature);
    if (!showWorkflowFeature) return;
    const workspaces: Workspaces[] = yield select(getWorkspaces);

    const workspaceIds = workspaces.map((w) => w.workspace.id);

    const responses: FetchWorkflowResponse[] = yield all(
      workspaceIds.map(async (workspaceId) => {
        return WorkflowApi.fetchWorkflows({ workspaceId });
      }),
    );

    // const response: ApiResponse = yield call(WorkflowApi.fetchWorkflows, {
    //   workspaceId,
    // });
    // const isValidResponse: boolean = yield validateResponse(response);

    const data = responses.reduce((acc: any, r: any) => {
      return acc.concat(r.data);
    }, []);

    // if (isValidResponse) {
    yield put({
      type: ReduxActionTypes.FETCH_ALL_WORKFLOWS_SUCCESS,
      payload: data,
    });
    // }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ALL_WORKFLOWS_ERROR,
      payload: { error: { message: createMessage(FETCH_WORKFLOW_ERROR) } },
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
    const workflow: Workflow = yield select(getWorkflowById, workflowId || "");
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

export default function* workflowsSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_ALL_WORKFLOWS_INIT,
      fetchAllWorkflowsSaga,
    ),
    // TODO (Workflows):(Change once we get fetchAllWorkflows without dependance on workspaceId)
    takeLatest(
      ReduxActionTypes.FETCH_USER_APPLICATIONS_WORKSPACES_SUCCESS,
      fetchAllWorkflowsSaga,
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
  ]);
}
