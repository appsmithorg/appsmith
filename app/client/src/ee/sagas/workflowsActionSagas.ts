import type { ApiResponse } from "api/ApiResponses";
import type { EvaluationReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  type ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ActionDataState } from "@appsmith/reducers/entityReducers/actionsReducer";
import {
  getActions,
  getDatasource,
  getPlugin,
} from "@appsmith/selectors/entitiesSelector";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import type { Action, ApiAction } from "entities/Action";
import {
  ActionContextType,
  PluginPackageName,
  PluginType,
} from "entities/Action";
import type { Datasource } from "entities/Datasource";
import { select, put, takeLatest, call, all } from "redux-saga/effects";
import { createDefaultActionPayloadWithPluginDefaults } from "sagas/ActionSagas";
import { validateResponse } from "sagas/ErrorSagas";
import { createNewQueryName, createNewApiName } from "utils/AppsmithUtils";
import type { Plugin } from "api/PluginApi";
import { createActionRequest } from "actions/pluginActionActions";
import ActionAPI from "api/ActionAPI";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import type { FetchWorkflowActionsPayload } from "@appsmith/actions/workflowActions";
import { createDefaultApiActionPayload } from "sagas/ApiPaneSagas";

export function* createWorkflowQueryActionSaga(
  action: ReduxAction<{
    workflowId: string;
    datasourceId: string;
    from: EventLocation;
  }>,
) {
  const { datasourceId, from, workflowId } = action.payload;
  const actions: ActionDataState = yield select(getActions);
  const datasource: Datasource = yield select(getDatasource, datasourceId);
  const plugin: Plugin = yield select(getPlugin, datasource?.pluginId);
  const newActionName =
    plugin?.type === PluginType.DB
      ? createNewQueryName(actions, workflowId || "", undefined, "workflowId")
      : createNewApiName(actions, workflowId || "", "workflowId");

  const createActionPayload: Partial<Action> = yield call(
    createDefaultActionPayloadWithPluginDefaults,
    {
      datasourceId,
      from,
      newActionName,
    },
  );

  yield put(
    createActionRequest({
      ...createActionPayload,
      workflowId,
      contextType: ActionContextType.WORKFLOW,
    }),
  );
}

/**
 * Creates an API with datasource as DEFAULT_REST_DATASOURCE (No user created datasource)
 * @param action
 */
function* createWorkflowApiActionSaga(
  action: ReduxAction<{
    workflowId: string;
    from: EventLocation;
    apiType?: string;
  }>,
) {
  const {
    apiType = PluginPackageName.REST_API,
    from,
    workflowId,
  } = action.payload;

  if (workflowId) {
    const actions: ActionDataState = yield select(getActions);
    const newActionName = createNewApiName(
      actions,
      workflowId || "",
      "workflowId",
    );
    // Note: Do NOT send pluginId on top level here.
    // It breaks embedded rest datasource flow.

    const createApiActionPayload: Partial<ApiAction> = yield call(
      createDefaultApiActionPayload,
      {
        apiType,
        from,
        newActionName,
      },
    );

    yield put(
      createActionRequest({
        ...createApiActionPayload,
        workflowId,
        contextType: ActionContextType.WORKFLOW,
      }), // We don't have recursive partial in typescript for now.
    );
  }
}

export function* fetchWorkflowActionsSaga(
  action: EvaluationReduxAction<FetchWorkflowActionsPayload>,
) {
  const { workflowId } = action.payload;
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.FETCH_ACTIONS_API,
    { mode: "EDITOR", appId: workflowId },
  );
  try {
    const response: ApiResponse<Action[]> = yield ActionAPI.fetchActions({
      workflowId,
    });
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
        payload: response.data,
        postEvalActions: action.postEvalActions,
      });
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.FETCH_ACTIONS_API,
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      payload: { error },
    });
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.FETCH_ACTIONS_API,
      { failed: true },
    );
  }
}

export default function* workflowsActionSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.CREATE_WORKFLOW_QUERY_ACTION,
      createWorkflowQueryActionSaga,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_WORKFLOW_API_ACTION,
      createWorkflowApiActionSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_WORKFLOW_ACTIONS_INIT,
      fetchWorkflowActionsSaga,
    ),
  ]);
}
