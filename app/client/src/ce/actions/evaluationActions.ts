import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { intersection, union } from "lodash";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import type { QueryActionConfig } from "entities/Action";
import type { DatasourceConfiguration } from "entities/Datasource";
import type { DiffWithReferenceState } from "workers/Evaluation/helpers";
import store from "store";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";

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
  [ReduxActionTypes.UPDATE_JS_ACTION_BODY_INIT]: true, // "lint only" action
  [ReduxActionTypes.META_UPDATE_DEBOUNCED_EVAL]: true,
  [ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_SUCCESS]: true,
  [ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS]: true,
  [ReduxActionTypes.INSTALL_LIBRARY_SUCCESS]: true,
  [ReduxActionTypes.UNINSTALL_LIBRARY_SUCCESS]: true,
  [ReduxActionTypes.BUFFERED_ACTION]: true,
  [ReduxActionTypes.BATCH_UPDATES_SUCCESS]: true,
};

export const LOG_REDUX_ACTIONS = {
  [ReduxActionTypes.UPDATE_LAYOUT]: true,
  [ReduxActionTypes.UPDATE_WIDGET_PROPERTY]: true,
  [ReduxActionTypes.UPDATE_WIDGET_NAME_SUCCESS]: true,
  [ReduxActionTypes.CREATE_ACTION_SUCCESS]: true,
  [ReduxActionTypes.UPDATE_ACTION_PROPERTY]: true,
};

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

  // Custom Library
  ReduxActionTypes.INSTALL_LIBRARY_SUCCESS,
  ReduxActionTypes.UNINSTALL_LIBRARY_SUCCESS,
  // Buffer
  ReduxActionTypes.BUFFERED_ACTION,
  // Generic
  ReduxActionTypes.TRIGGER_EVAL,
];
// Topics used for datasource and query form evaluations
export const FORM_EVALUATION_REDUX_ACTIONS = [
  ReduxActionTypes.INIT_FORM_EVALUATION,
  ReduxActionTypes.RUN_FORM_EVALUATION,
];

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
  updates: DiffWithReferenceState[],
): ReduxAction<{ updates: DiffWithReferenceState[] }> => {
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

export const EVAL_AND_LINT_REDUX_ACTIONS = union(
  EVALUATE_REDUX_ACTIONS,
  Object.keys(LINT_REDUX_ACTIONS),
);

export function getRequiresLinting(action: ReduxAction<unknown>) {
  const appMode: ReturnType<typeof getAppMode> = getAppMode(store.getState());

  const requiresLinting =
    appMode === APP_MODE.EDIT && shouldTriggerLinting(action);
  return requiresLinting;
}
