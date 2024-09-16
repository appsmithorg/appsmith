import type { DependencyMap } from "utils/DynamicBindingUtils";
import { call, fork, put, select, take } from "redux-saga/effects";
import {
  getEvaluationInverseDependencyMap,
  getDataTree,
} from "selectors/dataTreeSelectors";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { getActions } from "ee/selectors/entitiesSelector";
import type {
  ActionData,
  ActionDataState,
} from "ee/reducers/entityReducers/actionsReducer";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { findLoadingEntities } from "utils/WidgetLoadingStateUtils";

const actionExecutionRequestActions = [
  ReduxActionTypes.EXECUTE_PLUGIN_ACTION_REQUEST,
  ReduxActionTypes.RUN_ACTION_REQUEST,
];

const actionExecutionCompletionActions = [
  ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS,
  ReduxActionTypes.RUN_ACTION_SUCCESS,
  ReduxActionErrorTypes.RUN_ACTION_ERROR,
  ReduxActionErrorTypes.EXECUTE_PLUGIN_ACTION_ERROR,
];

const ACTION_EXECUTION_REDUX_ACTIONS = [
  // Actions
  ...actionExecutionRequestActions,
  ...actionExecutionCompletionActions,
  ReduxActionTypes.RUN_ACTION_CANCELLED,

  // Widget evalution
  ReduxActionTypes.SET_EVALUATED_TREE,
];

function* setWidgetsLoadingSaga(action: ReduxAction<unknown>) {
  if (actionExecutionCompletionActions.includes(action.type)) {
    // Ensure that data is already available in the dataTree and all
    // dependent entities have been re-evaluated
    yield take(ReduxActionTypes.SET_EVALUATED_TREE);
  }
  const actions: ActionDataState = yield select(getActions);
  const isLoadingActions: string[] = actions
    .filter((action: ActionData) => action.isLoading)
    .map((action: ActionData) => action.config.name);

  if (isLoadingActions.length === 0) {
    yield put({
      type: ReduxActionTypes.SET_LOADING_ENTITIES,
      payload: new Set<string>(),
    });
  } else {
    const inverseMap: DependencyMap = yield select(
      getEvaluationInverseDependencyMap,
    );
    const dataTree: DataTree = yield select(getDataTree);

    const loadingEntities = findLoadingEntities(
      isLoadingActions,
      dataTree,
      inverseMap,
    );
    yield put({
      type: ReduxActionTypes.SET_LOADING_ENTITIES,
      payload: loadingEntities,
    });
  }

  if (action.type !== ReduxActionTypes.SET_EVALUATED_TREE) {
    yield put({
      type: ReduxActionTypes.TRIGGER_EVAL,
    });
  }
}

function* actionExecutionChangeListenerSaga() {
  while (true) {
    const action: ReduxAction<unknown> = yield take(
      ACTION_EXECUTION_REDUX_ACTIONS,
    );
    yield fork(setWidgetsLoadingSaga, action);
  }
}

export default function* actionExecutionChangeListeners() {
  yield take(ReduxActionTypes.START_EVALUATION);
  while (true) {
    try {
      yield call(actionExecutionChangeListenerSaga);
    } catch (e) {
      log.error(e);
      Sentry.captureException(e);
    }
  }
}
