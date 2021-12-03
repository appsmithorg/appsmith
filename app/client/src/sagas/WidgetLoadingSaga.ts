import { DependencyMap } from "../utils/DynamicBindingUtils";
import { call, fork, put, select, take } from "redux-saga/effects";
import { getEvaluationInverseDependencyMap } from "../selectors/dataTreeSelectors";
import { getActions } from "../selectors/entitiesSelector";
import { ActionData } from "../reducers/entityReducers/actionsReducer";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "../constants/ReduxActionConstants";
import log from "loglevel";
import * as Sentry from "@sentry/react";

const createEntityDependencyMap = (dependencyMap: DependencyMap) => {
  const entityDepMap: DependencyMap = {};
  Object.entries(dependencyMap).forEach(([dependant, dependencies]) => {
    const entityDependant = dependant.split(".")[0];
    const existing = entityDepMap[entityDependant] || [];
    entityDepMap[entityDependant] = existing.concat(
      dependencies
        .map((dep) => {
          const value = dep.split(".")[0];
          if (value !== entityDependant) {
            return value;
          }
          return undefined;
        })
        .filter((value) => typeof value === "string") as string[],
    );
  });
  return entityDepMap;
};

const getEntityDependencies = (
  entityNames: string[],
  inverseMap: DependencyMap,
  visited: Set<string>,
): Set<string> => {
  const dependantsEntities: Set<string> = new Set();
  entityNames.forEach((entityName) => {
    if (entityName in inverseMap) {
      inverseMap[entityName].forEach((dependency) => {
        const dependantEntityName = dependency.split(".")[0];
        // Example: For a dependency chain that looks like Dropdown1.selectedOptionValue -> Table1.tableData -> Text1.text -> Dropdown1.options
        // Here we're operating on
        // Dropdown1 -> Table1 -> Text1 -> Dropdown1
        // It looks like a circle, but isn't
        // So we need to mark the visited nodes and avoid infinite recursion in case we've already visited a node once.
        if (visited.has(dependantEntityName)) {
          return;
        }
        visited.add(dependantEntityName);
        dependantsEntities.add(dependantEntityName);
        const childDependencies = getEntityDependencies(
          Array.from(dependantsEntities),
          inverseMap,
          visited,
        );
        childDependencies.forEach((entityName) => {
          dependantsEntities.add(entityName);
        });
      });
    }
  });
  return dependantsEntities;
};

const ACTION_EXECUTION_REDUX_ACTIONS = [
  ReduxActionTypes.RUN_ACTION_REQUEST,
  ReduxActionTypes.RUN_ACTION_SUCCESS,
  ReduxActionTypes.EXECUTE_PLUGIN_ACTION_REQUEST,
  ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS,
  ReduxActionErrorTypes.EXECUTE_PLUGIN_ACTION_ERROR,
];

function* setWidgetsLoadingSaga() {
  const inverseMap = yield select(getEvaluationInverseDependencyMap);
  const entityDependencyMap = createEntityDependencyMap(inverseMap);
  const actions = yield select(getActions);
  const isLoadingActions: string[] = actions
    .filter((action: ActionData) => action.isLoading)
    .map((action: ActionData) => action.config.name);

  const loadingEntities = getEntityDependencies(
    isLoadingActions,
    entityDependencyMap,
    new Set<string>(),
  );

  yield put({
    type: ReduxActionTypes.SET_LOADING_ENTITIES,
    payload: loadingEntities,
  });
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
