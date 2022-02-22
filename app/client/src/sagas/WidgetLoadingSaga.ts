import { DependencyMap } from "../utils/DynamicBindingUtils";
import { call, fork, put, select, take, TakeEffect } from "redux-saga/effects";
import {
  getEvaluationInverseDependencyMap,
  getDataTree,
} from "../selectors/dataTreeSelectors";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getActions } from "../selectors/entitiesSelector";
import { ActionData } from "../reducers/entityReducers/actionsReducer";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "../constants/ReduxActionConstants";
import log from "loglevel";
import * as Sentry from "@sentry/react";
import { get, set } from "lodash";

type ExtendedDependencyMap = Record<string, Array<string>>;

type FullDependencyMap = Record<string, ExtendedDependencyMap>;

const createEntityDependencyMap = (inverseMap: DependencyMap) => {
  const entityDepMap: FullDependencyMap = {};
  Object.entries(inverseMap).forEach(([dependantPath, dependencies]) => {
    const entityDependant = dependantPath.split(".")[0];
    const existing = entityDepMap[entityDependant] || {};
    let existing2 = existing[dependantPath] || [];
    existing2 = existing2.concat(
      dependencies.filter((dep) => {
        const value = dep.split(".")[0];
        if (value === "Table1" && dep.split(".")[1] !== "tableData") return;
        if (value !== entityDependant) {
          return dep;
        }
        return;
      }),
    );
    if (!(existing2.length > 0)) return;
    set(entityDepMap, [entityDependant, dependantPath], existing2);
  });
  return entityDepMap;
};

const getEntityDependencies = (
  fullEntityPaths: string[],
  fullDepMap: FullDependencyMap,
  visited: Set<string>,
): { names: Set<string>; fullPaths: Set<string> } => {
  const dependantsEntityNames = new Set<string>();
  const dependantEntityFullPaths = new Set<string>();
  fullEntityPaths.forEach((fullEntityPath) => {
    const entityName = fullEntityPath.split(".")[0];
    if (!(entityName in fullDepMap)) return;
    const extDepMap = fullDepMap[entityName];
    Object.entries(extDepMap).forEach(([fullPath, dependencies]) => {
      if (fullEntityPath.split(".").length > 1 && fullPath !== fullEntityPath)
        return;
      dependencies.forEach((dependantPath) => {
        const dependantPathArray = dependantPath.split(".");
        const dependantEntityName = dependantPathArray[0];
        // Example: For a dependency chain that looks like Dropdown1.selectedOptionValue -> Table1.tableData -> Text1.text -> Dropdown1.options
        // Here we're operating on
        // Dropdown1 -> Table1 -> Text1 -> Dropdown1
        // It looks like a circle, but isn't
        // So we need to mark the visited nodes and avoid infinite recursion in case we've already visited a node once.
        if (visited.has(entityName)) {
          return;
        }
        visited.add(entityName);
        dependantsEntityNames.add(dependantEntityName);
        dependantEntityFullPaths.add(dependantPath);
        const childDependencies = getEntityDependencies(
          Array.from(dependantEntityFullPaths),
          fullDepMap,
          visited,
        );
        childDependencies.names.forEach((entityName) => {
          dependantsEntityNames.add(entityName);
        });
        childDependencies.fullPaths.forEach((entityPath) => {
          dependantEntityFullPaths.add(entityPath);
        });
      });
    });
  });
  return { names: dependantsEntityNames, fullPaths: dependantEntityFullPaths };
};

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
  const inverseMap = yield select(getEvaluationInverseDependencyMap);
  const entityDependencyMap = createEntityDependencyMap(inverseMap);
  console.log("Hello INVERSE_MAP", inverseMap);
  console.log("Hello ENTITY_MAP", entityDependencyMap);
  const actions = yield select(getActions);
  const isLoadingActions: string[] = actions
    .filter((action: ActionData) => action.isLoading)
    .map((action: ActionData) => action.config.name);

  const loadingEntities = getEntityDependencies(
    isLoadingActions,
    entityDependencyMap,
    new Set<string>(),
  );

  console.log("Hello LOADING ACTIONS", isLoadingActions);
  console.log("Hello LOADING ENITIES", loadingEntities);
  console.log("Hello ------------------");

  // get all widgets evaluted data
  const dataTree: DataTree = yield select(getDataTree);
  // check animateLoading is active on current widgets and set
  Object.entries(dataTree).forEach(([entityName, entity]) => {
    if ("ENTITY_TYPE" in entity && entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET)
      if (get(dataTree, [entityName, "animateLoading"]) === false) {
        loadingEntities.names.delete(entityName);
      }
  });

  yield put({
    type: ReduxActionTypes.SET_LOADING_ENTITIES,
    payload: loadingEntities.names,
  });
}

function* actionExecutionChangeListenerSaga() {
  while (true) {
    const takeEffect: TakeEffect = yield take(ACTION_EXECUTION_REDUX_ACTIONS);
    console.log("Hello REDUX", takeEffect.type, takeEffect);
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
