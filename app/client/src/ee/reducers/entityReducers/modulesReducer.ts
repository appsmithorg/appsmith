import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type {
  FetchPackageResponse,
  FetchConsumablePackagesInWorkspaceResponse,
} from "@appsmith/api/PackageApi";
import type { DeleteModulePayload } from "@appsmith/actions/moduleActions";
import { klona } from "klona";
import type { ConvertEntityToInstanceResponse } from "@appsmith/api/ModuleInstanceApi";

type ID = string;

export type ModulesReducerState = Record<ID, Module>;

export const initialState: ModulesReducerState = {};

const modulesReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.FETCH_PACKAGE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<FetchPackageResponse>,
  ) => {
    draftState = klona(initialState);
    const { modules } = action.payload;
    modules.forEach((module) => {
      draftState[module.id] = module;
    });

    return draftState;
  },
  [ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<Module>,
  ) => {
    const module = action.payload;
    draftState[module.id] = module;

    return draftState;
  },
  [ReduxActionTypes.DELETE_QUERY_MODULE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<DeleteModulePayload>,
  ) => {
    const { id: moduleId } = action.payload;
    delete draftState[moduleId];

    return draftState;
  },
  [ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<Module>,
  ) => {
    const module = action.payload;
    draftState[module.id] = module;

    return draftState;
  },
  [ReduxActionTypes.CREATE_JS_MODULE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<Module>,
  ) => {
    const module = action.payload;
    draftState[module.id] = module;

    return draftState;
  },
  [ReduxActionTypes.UPDATE_MODULE_INPUTS_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<Module>,
  ) => {
    const module = action.payload;
    draftState[module.id].inputsForm = module.inputsForm;

    return draftState;
  },
  [ReduxActionTypes.FETCH_CONSUMABLE_PACKAGES_IN_WORKSPACE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<FetchConsumablePackagesInWorkspaceResponse>,
  ) => {
    draftState = klona(initialState);
    const { modules } = action.payload;
    modules.map((module) => {
      draftState[module.id] = module;
    });

    return draftState;
  },
  [ReduxActionTypes.RESET_EDITOR_REQUEST]: () => {
    return klona(initialState);
  },

  [ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_SUCCESS]: (
    draftState: ModulesReducerState,
    action: ReduxAction<ConvertEntityToInstanceResponse>,
  ) => {
    const { module } = action.payload;
    draftState[module.id] = module;
  },
});

export default modulesReducer;
