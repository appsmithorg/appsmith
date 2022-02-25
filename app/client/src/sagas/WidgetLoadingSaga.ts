import { DependencyMap } from "utils/DynamicBindingUtils";
import { call, fork, put, select, take, TakeEffect } from "redux-saga/effects";
import {
  getEvaluationInverseDependencyMap,
  getDataTree,
} from "../selectors/dataTreeSelectors";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
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
import { get, set } from "lodash";
import { isJSObject } from "workers/evaluationUtils";

type GroupedDependencyMap = Record<string, DependencyMap>;

// group dependants by entity and filter self-dependencies
// because, we're only interested in entities that depend on other entitites
// filter exception: JS_OBJECT's, when a function depends on another function within the same object
export const groupAndFilterDependantsMap = (
  inverseMap: DependencyMap,
  dataTree: DataTree,
) => {
  const entitiesDepMap: GroupedDependencyMap = {};

  Object.entries(inverseMap).forEach(([fullDependencyPath, dependants]) => {
    const dependencyEntityName = fullDependencyPath.split(".")[0];
    const isJS_Object = isJSObject(dataTree[dependencyEntityName]);

    const entityDependantsMap = entitiesDepMap[dependencyEntityName] || {};
    let entityPathDependants = entityDependantsMap[fullDependencyPath] || [];

    entityPathDependants = entityPathDependants.concat(
      isJS_Object
        ? /* include self-dependent properties for JsObjects 
              e.g. {
                "JsObject.internalFunc": [ "JsObject.fun1", "JsObject" ]
              }
              When fun1 calls internalfunc within it's body.
              Will keep "JsObject.fun1" and filter "JsObject".
          */
          dependants.filter((dep) => dep !== dependencyEntityName)
        : /* filter self-dependent properties for everything else
              e.g. {
                Select1.selectedOptionValue: [
                  'Select1.isValid', 'Select1'
                ]
              }
              Will remove both 'Select1.isValid', 'Select1'.
          */
          dependants.filter(
            (dep) => dep.split(".")[0] !== dependencyEntityName,
          ),
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

// get entities that depend on a given list of entites
// e.g. widgets that depend on a list of actions
export const getEntityDependants = (
  fullEntityPaths: string[],
  entitiesDependantsmap: GroupedDependencyMap,
  visitedPaths: Set<string>,
): { names: Set<string>; fullPaths: Set<string> } => {
  const dependantEntityNames = new Set<string>();
  const dependantEntityFullPaths = new Set<string>();

  fullEntityPaths.forEach((fullEntityPath) => {
    const entityPathArray = fullEntityPath.split(".");
    const entityName = entityPathArray[0];
    if (!(entityName in entitiesDependantsmap)) return;
    const entityDependantsMap = entitiesDependantsmap[entityName];

    Object.entries(entityDependantsMap).forEach(
      ([fullDependencyPath, dependants]) => {
        // skip other properties, when searching for a specific entityPath
        // e.g. JsObject.func1 should not go through dependants of JsObject.func2
        // NOTE: add example with Select1.selectedOptionValue and selectedOptionLabel
        if (
          entityPathArray.length > 1 &&
          fullDependencyPath !== fullEntityPath
        ) {
          return;
        }

        dependants.forEach((dependantPath) => {
          const dependantEntityName = dependantPath.split(".")[0];
          // Marking visited paths to avoid infinite recursion.
          if (visitedPaths.has(dependantPath)) {
            return;
          }
          visitedPaths.add(dependantPath);

          dependantEntityNames.add(dependantEntityName);
          dependantEntityFullPaths.add(dependantPath);

          const childDependants = getEntityDependants(
            Array.from(dependantEntityFullPaths),
            entitiesDependantsmap,
            visitedPaths,
          );
          childDependants.names.forEach((childDependantName) => {
            dependantEntityNames.add(childDependantName);
          });
          childDependants.fullPaths.forEach((childDependantPath) => {
            dependantEntityFullPaths.add(childDependantPath);
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
    const loadingEntities = getEntityDependants(
      isLoadingActions,
      entitiesDependantsMap,
      new Set<string>(),
    );

    console.log("Hello INVERSE_MAP", inverseMap);
    console.log("Hello ENTITY_MAP", entitiesDependantsMap);
    console.log("Hello LOADING ACTIONS", isLoadingActions);
    console.log("Hello LOADING ENITIES", loadingEntities);
    console.log("Hello ------------------");

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
