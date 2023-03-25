import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import _ from "lodash";
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import type { Diff } from "deep-diff";
import type { QueryActionConfig } from "entities/Action";

export const FIRST_EVAL_REDUX_ACTIONS = [
  // Pages
  ReduxActionTypes.FETCH_ALL_PAGE_ENTITY_COMPLETION,
];

export const LINT_REDUX_ACTIONS = {
  [ReduxActionTypes.FETCH_ALL_PAGE_ENTITY_COMPLETION]: true,
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: true,
  [ReduxActionTypes.UPDATE_ACTION_PROPERTY]: true,
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: true,
  [ReduxActionTypes.COPY_ACTION_SUCCESS]: true,
  [ReduxActionTypes.MOVE_ACTION_SUCCESS]: true,
  [ReduxActionTypes.CREATE_JS_ACTION_SUCCESS]: true,
  [ReduxActionTypes.DELETE_JS_ACTION_SUCCESS]: true,
  [ReduxActionTypes.COPY_JS_ACTION_SUCCESS]: true,
  [ReduxActionTypes.MOVE_JS_ACTION_SUCCESS]: true,
  [ReduxActionTypes.SET_USER_CURRENT_GEO_LOCATION]: true,
  [ReduxActionTypes.UPDATE_LAYOUT]: true,
  [ReduxActionTypes.UPDATE_WIDGET_PROPERTY]: true,
  [ReduxActionTypes.UPDATE_WIDGET_NAME_SUCCESS]: true,
  [ReduxActionTypes.UPDATE_JS_ACTION_BODY_SUCCESS]: true,
  [ReduxActionTypes.META_UPDATE_DEBOUNCED_EVAL]: true,
};

export const LOG_REDUX_ACTIONS = [
  ReduxActionTypes.UPDATE_LAYOUT,
  ReduxActionTypes.UPDATE_WIDGET_PROPERTY,
  ReduxActionTypes.UPDATE_WIDGET_NAME_SUCCESS,
  ReduxActionTypes.CREATE_ACTION_SUCCESS,
];

export const EVALUATE_REDUX_ACTIONS = [
  ...FIRST_EVAL_REDUX_ACTIONS,
  // Actions
  ReduxActionTypes.FETCH_PLUGIN_FORM_CONFIGS_SUCCESS,
  ReduxActionTypes.FETCH_ACTIONS_VIEW_MODE_SUCCESS,
  ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
  ReduxActionErrorTypes.FETCH_ACTIONS_VIEW_MODE_ERROR,
  ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS,
  ReduxActionTypes.SUBMIT_CURL_FORM_SUCCESS,
  ReduxActionTypes.CREATE_ACTION_SUCCESS,
  ReduxActionTypes.UPDATE_ACTION_PROPERTY,
  ReduxActionTypes.DELETE_ACTION_SUCCESS,
  ReduxActionTypes.COPY_ACTION_SUCCESS,
  ReduxActionTypes.MOVE_ACTION_SUCCESS,
  ReduxActionTypes.RUN_ACTION_SUCCESS,
  ReduxActionErrorTypes.RUN_ACTION_ERROR,
  ReduxActionTypes.EXECUTE_PLUGIN_ACTION_SUCCESS,
  ReduxActionErrorTypes.EXECUTE_PLUGIN_ACTION_ERROR,
  ReduxActionTypes.CLEAR_ACTION_RESPONSE,
  // JS Actions
  ReduxActionTypes.CREATE_JS_ACTION_SUCCESS,
  ReduxActionTypes.DELETE_JS_ACTION_SUCCESS,
  ReduxActionTypes.COPY_JS_ACTION_SUCCESS,
  ReduxActionTypes.MOVE_JS_ACTION_SUCCESS,
  ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
  ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_SUCCESS,
  ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_SUCCESS,
  ReduxActionErrorTypes.FETCH_JS_ACTIONS_VIEW_MODE_ERROR,
  ReduxActionTypes.UPDATE_JS_ACTION_BODY_SUCCESS,
  ReduxActionTypes.SET_JS_FUNCTION_EXECUTION_DATA,
  // App Data
  ReduxActionTypes.SET_APP_MODE,
  ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS,
  ReduxActionTypes.UPDATE_APP_STORE,
  ReduxActionTypes.SET_USER_CURRENT_GEO_LOCATION,
  // Widgets
  ReduxActionTypes.UPDATE_LAYOUT,
  ReduxActionTypes.UPDATE_WIDGET_PROPERTY,
  ReduxActionTypes.UPDATE_WIDGET_NAME_SUCCESS,
  // Meta Widgets
  ReduxActionTypes.MODIFY_META_WIDGETS,
  ReduxActionTypes.DELETE_META_WIDGETS,
  // Widget Meta
  ReduxActionTypes.SET_META_PROP_AND_EVAL,
  ReduxActionTypes.META_UPDATE_DEBOUNCED_EVAL,
  ReduxActionTypes.RESET_WIDGET_META,
  // Batches
  ReduxActionTypes.BATCH_UPDATES_SUCCESS,
  // App Theme
  ReduxActionTypes.UPDATE_SELECTED_APP_THEME_SUCCESS,
  ReduxActionTypes.CHANGE_SELECTED_APP_THEME_SUCCESS,
  ReduxActionTypes.SET_PREVIEW_APP_THEME,
];
// Topics used for datasource and query form evaluations
export const FORM_EVALUATION_REDUX_ACTIONS = [
  ReduxActionTypes.INIT_FORM_EVALUATION,
  ReduxActionTypes.RUN_FORM_EVALUATION,
];
export const shouldProcessBatchedAction = (action: ReduxAction<unknown>) => {
  if (
    action.type === ReduxActionTypes.BATCH_UPDATES_SUCCESS &&
    Array.isArray(action.payload)
  ) {
    const batchedActionTypes = action.payload.map(
      (batchedAction) => batchedAction.type,
    );
    return (
      _.intersection(EVALUATE_REDUX_ACTIONS, batchedActionTypes).length > 0
    );
  }
  return true;
};

export function shouldLint(action: ReduxAction<unknown>) {
  if (
    action.type === ReduxActionTypes.BATCH_UPDATES_SUCCESS &&
    Array.isArray(action.payload)
  ) {
    const batchedActionTypes = action.payload.map(
      (batchedAction) => batchedAction.type,
    );
    return batchedActionTypes.some(
      (actionType) => LINT_REDUX_ACTIONS[actionType],
    );
  }
  return LINT_REDUX_ACTIONS[action.type];
}

export function shouldLog(action: ReduxAction<unknown>) {
  return LOG_REDUX_ACTIONS.includes(action.type);
}

export const setEvaluatedTree = (
  updates: Diff<DataTree, DataTree>[],
): ReduxAction<{ updates: Diff<DataTree, DataTree>[] }> => {
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
  editorConfig: any,
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
    },
  };
};
