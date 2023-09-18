import type { DependencyMap } from "utils/DynamicBindingUtils";
import { call, fork, put, select, take } from "redux-saga/effects";
import {
  getEvaluationInverseDependencyMap,
  getDataTree,
} from "selectors/dataTreeSelectors";
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { getActions } from "@appsmith/selectors/entitiesSelector";
import type {
  ActionData,
  ActionDataState,
} from "reducers/entityReducers/actionsReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
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
  ReduxActionTypes.RUN_ACTION_CANCELLED,
];

const ACTION_EXECUTION_REDUX_ACTIONS = [
  // Actions
  ...actionExecutionRequestActions,
  ...actionExecutionCompletionActions,

  // Widget evalution
  ReduxActionTypes.SET_EVALUATED_TREE,
];

function* dispatchSetLoadingAction({
  loadingEntities,
  loadingTriggerAction,
}: {
  loadingEntities: Set<string>;
  loadingTriggerAction: ReduxAction<unknown>;
}) {
  yield put({
    type: ReduxActionTypes.SET_LOADING_ENTITIES,
    payload: loadingEntities,
  });

  if (loadingTriggerAction.type !== ReduxActionTypes.SET_EVALUATED_TREE) {
    yield put({
      type: ReduxActionTypes.TRIGGER_EVAL,
    });
  }
}

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
    yield call(dispatchSetLoadingAction, {
      loadingEntities: new Set<string>(),
      loadingTriggerAction: action,
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

    yield call(dispatchSetLoadingAction, {
      loadingEntities,
      loadingTriggerAction: action,
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
