import type { ReduxAction } from "./ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { intersection } from "lodash";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import type { DiffWithNewTreeState } from "workers/Evaluation/helpers";
import {
  EVALUATE_REDUX_ACTIONS,
  EVAL_AND_LINT_REDUX_ACTIONS,
  LINT_REDUX_ACTIONS,
  LOG_REDUX_ACTIONS,
} from "ee/actions/evaluationActionsList";
import type {
  ConditionalOutput,
  DynamicValues,
} from "reducers/evaluationReducers/formEvaluationReducer";

export const shouldTriggerEvaluation = (action: ReduxAction<unknown>) => {
  return (
    shouldProcessAction(action) && EVALUATE_REDUX_ACTIONS.includes(action.type)
  );
};
export const shouldTriggerLinting = (action: ReduxAction<unknown>) => {
  return shouldProcessAction(action) && !!LINT_REDUX_ACTIONS[action.type];
};

export const getAllActionTypes = (action: ReduxAction<unknown>) => {
  if (
    action.type === ReduxActionTypes.BATCH_UPDATES_SUCCESS &&
    Array.isArray(action.payload)
  ) {
    const batchedActionTypes = action.payload.map(
      (batchedAction) => batchedAction.type as string,
    );

    return batchedActionTypes;
  }

  return [action.type];
};

export const shouldProcessAction = (action: ReduxAction<unknown>) => {
  const actionTypes = getAllActionTypes(action);

  return intersection(EVAL_AND_LINT_REDUX_ACTIONS, actionTypes).length > 0;
};

export function shouldLog(action: ReduxAction<unknown>) {
  if (
    action.type === ReduxActionTypes.BATCH_UPDATES_SUCCESS &&
    Array.isArray(action.payload)
  ) {
    const batchedActionTypes = action.payload.map(
      (batchedAction) => batchedAction.type,
    );

    return batchedActionTypes.some(
      (actionType) => LOG_REDUX_ACTIONS[actionType],
    );
  }

  return LOG_REDUX_ACTIONS[action.type];
}

export const setEvaluatedTree = (
  updates: DiffWithNewTreeState[],
): ReduxAction<{ updates: DiffWithNewTreeState[] }> => {
  return {
    type: ReduxActionTypes.SET_EVALUATED_TREE,
    payload: { updates },
  };
};

export const setDependencyMap = (
  inverseDependencyMap: DependencyMap,
): ReduxAction<{ inverseDependencyMap: DependencyMap }> => {
  return {
    type: ReduxActionTypes.SET_EVALUATION_INVERSE_DEPENDENCY_MAP,
    payload: { inverseDependencyMap },
  };
};

// These actions require the entire tree to be re-evaluated
const FORCE_EVAL_ACTIONS = {
  [ReduxActionTypes.INSTALL_LIBRARY_SUCCESS]: true,
  [ReduxActionTypes.UNINSTALL_LIBRARY_SUCCESS]: true,
};

export const shouldForceEval = (action: ReduxAction<unknown>) => {
  return !!FORCE_EVAL_ACTIONS[action.type];
};

export const fetchFormDynamicValNextPage = (payload?: {
  value: ConditionalOutput;
  dynamicFetchedValues: DynamicValues;
  actionId: string;
  datasourceId: string;
  pluginId: string;
  identifier: string;
}) => {
  if (payload) {
    return {
      type: ReduxActionTypes.FETCH_FORM_DYNAMIC_VAL_NEXT_PAGE_INIT,
      payload,
    };
  }
};
