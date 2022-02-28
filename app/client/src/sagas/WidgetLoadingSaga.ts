import { DependencyMap } from "utils/DynamicBindingUtils";
import { call, fork, put, select, take } from "redux-saga/effects";
import {
  getEvaluationInverseDependencyMap,
  getDataTree,
} from "../selectors/dataTreeSelectors";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { getActions } from "../selectors/entitiesSelector";
import {
  ActionData,
  ActionDataState,
} from "../reducers/entityReducers/actionsReducer";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "../constants/ReduxActionConstants";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { get } from "lodash";
import {
  getEntityDependants,
  groupAndFilterDependantsMap,
} from "utils/WidgetLoadingStateUtils";

const ACTION_EXECUTION_REDUX_ACTIONS = [
  // Actions
  ReduxActionTypes.RUN_ACTION_REQUEST,
  ReduxActionTypes.RUN_ACTION_SUCCESS,
  ReduxActionTypes.EXECUTE_PLUGIN_ACTION_REQUEST,
  ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS,
  ReduxActionErrorTypes.EXECUTE_PLUGIN_ACTION_ERROR,
  // Widget evalution
  ReduxActionTypes.SET_EVALUATED_TREE,
];

function* setWidgetsLoadingSaga() {
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

    const entitiesDependantsMap = groupAndFilterDependantsMap(
      inverseMap,
      dataTree,
    );
    const loadingEntitiesDetails = getEntityDependants(
      isLoadingActions,
      entitiesDependantsMap,
      new Set<string>(),
    );

    // check animateLoading is active on current widgets and set
    const filteredLoadingEntityNames = new Set<string>();
    loadingEntitiesDetails.names.forEach((entityName) => {
      get(dataTree, [entityName, "animateLoading"]) === true &&
        filteredLoadingEntityNames.add(entityName);
    });

    yield put({
      type: ReduxActionTypes.SET_LOADING_ENTITIES,
      payload: filteredLoadingEntityNames,
    });
  }
}

function* actionExecutionChangeListenerSaga() {
  while (true) {
    yield take(ACTION_EXECUTION_REDUX_ACTIONS);
    yield fork(setWidgetsLoadingSaga);
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
