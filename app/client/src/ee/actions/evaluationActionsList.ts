export * from "ce/actions/evaluationActionsList";
import {
  EVALUATE_REDUX_ACTIONS as CE_EVALUATE_REDUX_ACTIONS,
  getRequiresLinting as CE_getRequiresLinting,
  LINT_REDUX_ACTIONS as CE_LINT_REDUX_ACTIONS,
  LOG_REDUX_ACTIONS as CE_LOG_REDUX_ACTIONS,
} from "ce/actions/evaluationActionsList";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { getModuleMode } from "@appsmith/selectors/packageSelectors";
import store from "store";
import { MODULE_MODE } from "@appsmith/entities/package";
import { FIRST_EVAL_REDUX_ACTIONS as CE_FIRST_EVAL_REDUX_ACTIONS } from "ce/actions/evaluationActionsList";
import { shouldTriggerLinting } from "actions/evaluationActions";
import { union } from "lodash";

export const FIRST_EVAL_REDUX_ACTIONS = [
  ...CE_FIRST_EVAL_REDUX_ACTIONS,
  ReduxActionTypes.FETCH_ALL_MODULE_ENTITY_COMPLETION,
];

export const LINT_REDUX_ACTIONS = {
  ...CE_LINT_REDUX_ACTIONS,
  // Query Modules
  [ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS]: true,
  [ReduxActionTypes.FETCH_ALL_MODULE_ENTITY_COMPLETION]: true,
  [ReduxActionTypes.DELETE_QUERY_MODULE_SUCCESS]: true,
  [ReduxActionTypes.UPDATE_MODULE_INPUTS_SUCCESS]: true,
  // Module instances
  [ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS]: true,
  [ReduxActionTypes.SETUP_MODULE_INSTANCE_SUCCESS]: true,
  [ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS]: true,
  [ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_SUCCESS]: true,
  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_SUCCESS]: true,
};

export const LOG_REDUX_ACTIONS = CE_LOG_REDUX_ACTIONS;

export const EVALUATE_REDUX_ACTIONS = [
  ...CE_EVALUATE_REDUX_ACTIONS,
  ...FIRST_EVAL_REDUX_ACTIONS,
  // Query Modules
  ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS,
  ReduxActionTypes.DELETE_QUERY_MODULE_SUCCESS,
  ReduxActionTypes.ADD_MODULE_INPUT_SUCCESS,
  ReduxActionTypes.UPDATE_MODULE_INPUT_SUCCESS,
  ReduxActionTypes.DELETE_MODULE_INPUT_SUCCESS,
  ReduxActionTypes.UPDATE_MODULE_INPUTS_SUCCESS,
  ReduxActionErrorTypes.FETCH_MODULE_ENTITIES_ERROR,
  // Module instances
  ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS,
  ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS,
  ReduxActionTypes.SETUP_MODULE_INSTANCE_SUCCESS,
  ReduxActionTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_SUCCESS,
  ReduxActionErrorTypes.SETUP_MODULE_INSTANCE_ERROR,
  ReduxActionErrorTypes.SETUP_MODULE_INSTANCE_FOR_VIEW_ERROR,
  ReduxActionTypes.REFACTOR_MODULE_INSTANCE_COMPLETION,
  ReduxActionTypes.UPDATE_MODULE_INSTANCE_SUCCESS,
  ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_SUCCESS,
];

export const EVAL_AND_LINT_REDUX_ACTIONS = union(
  EVALUATE_REDUX_ACTIONS,
  Object.keys(LINT_REDUX_ACTIONS),
);

export function getRequiresLinting(action: ReduxAction<unknown>) {
  const packageMode: ReturnType<typeof getModuleMode> = getModuleMode(
    store.getState(),
  );

  const requiresLinting =
    packageMode === MODULE_MODE.EDIT && shouldTriggerLinting(action);
  return CE_getRequiresLinting(action) || requiresLinting;
}
