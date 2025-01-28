import type { ReduxAction } from "./ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { intersection } from "lodash";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import type { QueryActionConfig } from "entities/Action";
import type { DatasourceConfiguration } from "entities/Datasource";
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

// Called when a form is being setup, for setting up the base condition evaluations for the form
export const initFormEvaluations = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorConfig: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settingConfig: any,
  formId: string,
) => {
  return {
    type: ReduxActionTypes.INIT_FORM_EVALUATION,
    payload: { editorConfig, settingConfig, formId },
  };
};

// Called when there is change in the data of the form, re evaluates the whole form
export const startFormEvaluations = (
  formId: string,
  formData: QueryActionConfig,
  datasourceId: string,
  pluginId: string,
  actionDiffPath?: string,
  hasRouteChanged?: boolean,
  datasourceConfiguration?: DatasourceConfiguration,
) => {
  return {
    type: ReduxActionTypes.RUN_FORM_EVALUATION,
    payload: {
      formId,
      actionConfiguration: formData,
      datasourceId,
      pluginId,
      actionDiffPath,
      hasRouteChanged,
      datasourceConfiguration,
    },
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
}) => {
  if (payload) {
    return {
      type: ReduxActionTypes.FETCH_FORM_DYNAMIC_VAL_NEXT_PAGE_INIT,
      payload,
    };
  }
};
