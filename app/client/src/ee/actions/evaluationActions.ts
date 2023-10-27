export * from "ce/actions/evaluationActions";
import {
  EVALUATE_REDUX_ACTIONS as CE_EVALUATE_REDUX_ACTIONS,
  shouldTriggerLinting,
  getRequiresLinting as CE_getRequiresLinting,
} from "ce/actions/evaluationActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { getModuleMode } from "@appsmith/selectors/packageSelectors";
import store from "store";
import { MODULE_MODE } from "@appsmith/entities/package";

export const EVALUATE_REDUX_ACTIONS = [
  ...CE_EVALUATE_REDUX_ACTIONS,
  ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS,
  ReduxActionTypes.DELETE_QUERY_MODULE_SUCCESS,
  ReduxActionTypes.ADD_MODULE_INPUT_SUCCESS,
  ReduxActionTypes.UPDATE_MODULE_INPUT_SUCCESS,
  ReduxActionTypes.DELETE_MODULE_INPUT_SUCCESS,
];

export function getRequiresLinting(action: ReduxAction<unknown>) {
  const packageMode: ReturnType<typeof getModuleMode> = getModuleMode(
    store.getState(),
  );

  const requiresLinting =
    packageMode === MODULE_MODE.EDIT && shouldTriggerLinting(action);
  return CE_getRequiresLinting(action) || requiresLinting;
}
