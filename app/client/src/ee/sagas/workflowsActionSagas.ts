import type { ApiResponse } from "api/ApiResponses";
import type { EvaluationReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  type ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { getJSCollections } from "@appsmith/selectors/entitiesSelector";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import type { Action, ApiAction } from "entities/Action";
import { PluginPackageName } from "entities/Action";
import { select, put, takeLatest, call, all } from "redux-saga/effects";
import { createDefaultActionPayloadWithPluginDefaults } from "sagas/ActionSagas";
import { validateResponse } from "sagas/ErrorSagas";
import { createNewJSFunctionName } from "utils/AppsmithUtils";
import { createActionRequest } from "actions/pluginActionActions";
import ActionAPI from "api/ActionAPI";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import type { FetchWorkflowActionsPayload } from "@appsmith/actions/workflowActions";
import { createDefaultApiActionPayload } from "sagas/ApiPaneSagas";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";
import type { CreateJSCollectionRequest } from "@appsmith/api/JSActionAPI";
import JSActionAPI from "@appsmith/api/JSActionAPI";
import type { JSCollection } from "entities/JSCollection";
import type {
  JSCollectionData,
  JSCollectionDataState,
} from "@appsmith/reducers/entityReducers/jsActionsReducer";
import { createJSCollectionRequest } from "actions/jsActionActions";
import { generateDefaultJSObject } from "sagas/JSPaneSagas";
import { createDummyJSCollectionActions } from "utils/JSPaneUtils";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { getMainJsObjectIdOfCurrentWorkflow } from "@appsmith/selectors/workflowSelectors";

export function* createWorkflowQueryActionSaga(
  action: ReduxAction<{
    workflowId: string;
    datasourceId: string;
    from: EventLocation;
  }>,
) {
  const { datasourceId, from, workflowId } = action.payload;

  const createActionPayload: Partial<Action> = yield call(
    createDefaultActionPayloadWithPluginDefaults,
    {
      datasourceId,
      from,
    },
  );

  yield put(
    createActionRequest({
      ...createActionPayload,
      workflowId,
      contextType: ActionParentEntityType.WORKFLOW,
    }),
  );
}

/**
 * Creates an API with datasource as DEFAULT_REST_DATASOURCE (No user created datasource)
 * @param action
 */
export function* createWorkflowApiActionSaga(
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
    const createApiActionPayload: Partial<ApiAction> = yield call(
      createDefaultApiActionPayload,
      {
        apiType,
        from,
      },
    );

    yield put(
      createActionRequest({
        ...createApiActionPayload,
        workflowId,
        contextType: ActionParentEntityType.WORKFLOW,
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

export function* fetchWorkflowJSCollectionsSaga(
  action: EvaluationReduxAction<FetchWorkflowActionsPayload>,
) {
  const { workflowId } = action.payload;
  try {
    const response: ApiResponse<JSCollection[]> =
      yield JSActionAPI.fetchJSCollections({ workflowId });

    const mainJsObjectIdOfCurrentWorkflow: string = yield select(
      getMainJsObjectIdOfCurrentWorkflow,
      workflowId,
    );

    let updatedResponse: JSCollection[] = [];
    if (response.data.length > 0) {
      updatedResponse = response.data.map((jsCollection) => {
        if (jsCollection.id === mainJsObjectIdOfCurrentWorkflow) {
          return {
            ...jsCollection,
            isMainJSCollection: true,
          };
        }
        return jsCollection;
      });
    }
    yield put({
      type: ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      payload: updatedResponse || [],
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      payload: { error },
    });
  }
}

export function* createWorkflowJSActionSaga(
  action: ReduxAction<{ workflowId: string; from: EventLocation }>,
) {
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const { from, workflowId } = action.payload;

  if (workflowId) {
    const jsActions: JSCollectionDataState = yield select(getJSCollections);
    const workflowJsActions = jsActions.filter(
      (a: JSCollectionData) => a.config.workflowId === workflowId,
    );
    const newJSCollectionName = createNewJSFunctionName(
      workflowJsActions,
      workflowId,
    );
    const { actions, body, variables } =
      createDummyJSCollectionActions(workspaceId);

    const defaultJSObject: CreateJSCollectionRequest =
      yield generateDefaultJSObject({
        name: newJSCollectionName,
        workspaceId,
        actions,
        body,
        variables,
      });

    yield put(
      createJSCollectionRequest({
        from: from,
        request: {
          ...defaultJSObject,
          workflowId,
          contextType: ActionParentEntityType.WORKFLOW,
        },
      }),
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
      ReduxActionTypes.CREATE_WORKFLOW_JS_ACTION,
      createWorkflowJSActionSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_WORKFLOW_ACTIONS_INIT,
      fetchWorkflowActionsSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_WORKFLOW_JS_ACTIONS_INIT,
      fetchWorkflowJSCollectionsSaga,
    ),
  ]);
}
