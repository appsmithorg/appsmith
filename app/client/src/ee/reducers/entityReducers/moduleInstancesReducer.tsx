import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type {
  ModuleInstance,
  ModuleInstanceId,
  QueryModuleInstance,
} from "@appsmith/constants/ModuleInstanceConstants";

export type ModuleInstanceReducerState = Record<
  ModuleInstanceId,
  ModuleInstance
>;

const initialState: ModuleInstanceReducerState = {};

export const handlers = {
  [ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<ModuleInstance>,
  ) => {
    draftState[action.payload.id] = action.payload;
    return draftState;
  },

  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<QueryModuleInstance>,
  ) => {
    draftState[action.payload.id] = action.payload;
    return draftState;
  },

  [ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<QueryModuleInstance>,
  ) => {
    delete draftState[action.payload.id];
    return draftState;
  },

  [ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<QueryModuleInstance[]>,
  ) => {
    const moduleInstances = action.payload;

    moduleInstances.forEach((moduleInstance: QueryModuleInstance) => {
      draftState[moduleInstance.id] = moduleInstance;
    });

    return draftState;
  },

  [ReduxActionTypes.FETCH_MODULE_INSTANCE_FOR_PAGE_VIEW_MODE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<QueryModuleInstance[]>,
  ) => {
    const moduleInstances = action.payload;

    moduleInstances.forEach((moduleInstance: QueryModuleInstance) => {
      draftState[moduleInstance.id] = moduleInstance;
    });

    return draftState;
  },
};

const moduleInstanceReducer = createImmerReducer(initialState, handlers);

export default moduleInstanceReducer;
