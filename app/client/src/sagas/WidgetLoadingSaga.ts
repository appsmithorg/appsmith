import { DependencyMap } from "utils/DynamicBindingUtils";
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

type GroupedDependencyMap = Record<string, DependencyMap>;

export const createEntitiesDependantsMap = (inverseMap: DependencyMap) => {
  const entitiesDepMap: GroupedDependencyMap = {};

  Object.entries(inverseMap).forEach(([fullDependencyPath, dependants]) => {
    const dependencyEntityName = fullDependencyPath.split(".")[0];
    const entityDepMap = entitiesDepMap[dependencyEntityName] || {};
    let entityPathDependants = entityDepMap[fullDependencyPath] || [];

    entityPathDependants = entityPathDependants.concat(
      dependants.filter((dep) => dep.split(".")[0] !== dependencyEntityName),
    );

    if (!(entityPathDependants.length > 0)) return;
    set(
      entitiesDepMap,
      [dependencyEntityName, fullDependencyPath],
      entityPathDependants,
    );
  });

  return entitiesDepMap;
};

export const getEntityDependants = (
  fullEntityPaths: string[],
  entitiesDependantsmap: GroupedDependencyMap,
  visitedPaths: Set<string>,
): { names: Set<string>; fullPaths: Set<string> } => {
  const dependantEntityNames = new Set<string>();
  const dependantEntityFullPaths = new Set<string>();

  fullEntityPaths.forEach((fullEntityPath) => {
    const entityName = fullEntityPath.split(".")[0];
    if (!(entityName in entitiesDependantsmap)) return;
    const entityDependantsMap = entitiesDependantsmap[entityName];

    Object.entries(entityDependantsMap).forEach(
      ([fullDependencyPath, dependants]) => {
        if (
          fullEntityPath.split(".").length > 1 &&
          fullDependencyPath !== fullEntityPath
        ) {
          return;
        }

        dependants.forEach((dependantPath) => {
          const dependantEntityName = dependantPath.split(".")[0];
          // Example: For a dependency chain that looks like Dropdown1.selectedOptionValue -> Table1.tableData -> Text1.text -> Dropdown1.options
          // Here we're operating on
          // Dropdown1 -> Table1 -> Text1 -> Dropdown1
          // It looks like a circle, but isn't
          // So we need to mark the visited nodes and avoid infinite recursion in case we've already visited a node once.
          if (visitedPaths.has(dependantPath)) {
            return;
          }
          visitedPaths.add(dependantPath);

          dependantEntityNames.add(dependantEntityName);
          dependantEntityFullPaths.add(dependantPath);

          const childDependencies = getEntityDependants(
            Array.from(dependantEntityFullPaths),
            entitiesDependantsmap,
            visitedPaths,
          );
          childDependencies.names.forEach((entityName) => {
            dependantEntityNames.add(entityName);
          });
          childDependencies.fullPaths.forEach((entityPath) => {
            dependantEntityFullPaths.add(entityPath);
          });
        });
      },
    );
  });

  return { names: dependantEntityNames, fullPaths: dependantEntityFullPaths };
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
  const entitiesDependantsMap = createEntitiesDependantsMap(inverseMap);
  console.log("Hello INVERSE_MAP", inverseMap);
  console.log("Hello ENTITY_MAP", entitiesDependantsMap);
  const actions = yield select(getActions);
  const isLoadingActions: string[] = actions
    .filter((action: ActionData) => action.isLoading)
    .map((action: ActionData) => action.config.name);

  const loadingEntities = getEntityDependants(
    isLoadingActions,
    entitiesDependantsMap,
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
