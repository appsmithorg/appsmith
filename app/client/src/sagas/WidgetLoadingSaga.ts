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
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { findLoadingEntities } from "utils/WidgetLoadingStateUtils";
import {
  actionExecutionCompletionActions,
  actionExecutionRequestActions,
} from "./ActionExecution/PluginActionSaga";
const ACTION_EXECUTION_REDUX_ACTIONS = [
  ...actionExecutionCompletionActions,
  ...actionExecutionRequestActions,
];
function* setWidgetsLoadingSaga(action: ReduxAction<unknown>) {
  if (actionExecutionCompletionActions.includes(action.type)) {
    // For actions that set isLoading to false,
    // Before proceeding to update the isLoading property of dependent entities
    // Ensure that data is already available in the dataTree and all
    // dependent entities have been evaluated
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
