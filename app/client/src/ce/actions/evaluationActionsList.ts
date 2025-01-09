import type { ReduxAction } from "../../actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { union } from "lodash";
import store from "store";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { shouldTriggerLinting } from "actions/evaluationActions";

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

export const JS_ACTIONS = [
  ReduxActionTypes.CREATE_JS_ACTION_SUCCESS,
  ReduxActionTypes.DELETE_JS_ACTION_SUCCESS,
  ReduxActionTypes.COPY_JS_ACTION_SUCCESS,
  ReduxActionTypes.MOVE_JS_ACTION_SUCCESS,
  ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
  ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_SUCCESS,
  ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_SUCCESS,
  ReduxActionErrorTypes.FETCH_JS_ACTIONS_VIEW_MODE_ERROR,
  ReduxActionTypes.UPDATE_JS_ACTION_BODY_SUCCESS,
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
  ReduxActionTypes.CLEAR_ACTION_RESPONSE,
  // JS Actions
  ...JS_ACTIONS,
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
  ReduxActionTypes.RESET_WIDGET_META_UPDATES,
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
  ReduxActionTypes.UPDATE_ACTION_DATA,
];
// Topics used for datasource and query form evaluations
export const FORM_EVALUATION_REDUX_ACTIONS = [
  ReduxActionTypes.INIT_FORM_EVALUATION,
  ReduxActionTypes.RUN_FORM_EVALUATION,
];

export const EVAL_AND_LINT_REDUX_ACTIONS = union(
  EVALUATE_REDUX_ACTIONS,
  Object.keys(LINT_REDUX_ACTIONS),
);

export function getRequiresLinting(action: ReduxAction<unknown>) {
  const appMode: ReturnType<typeof getAppMode> = getAppMode(store.getState());

  // for any case apart from published mode of an app, we should trigger linting
  const requiresLinting =
    appMode !== APP_MODE.PUBLISHED && shouldTriggerLinting(action);

  return requiresLinting;
}
