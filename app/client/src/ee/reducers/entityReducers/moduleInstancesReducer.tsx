import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type {
  ModuleInstance,
  ModuleInstanceId,
  QueryModuleInstance,
} from "@appsmith/constants/ModuleInstanceConstants";
import type { CreateModuleInstanceResponse } from "@appsmith/api/ModuleInstanceApi";
import { klona } from "klona";

export type ModuleInstanceReducerState = Record<
  ModuleInstanceId,
  ModuleInstance
>;

const initialState: ModuleInstanceReducerState = {};

export const handlers = {
  [ReduxActionTypes.CREATE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<CreateModuleInstanceResponse>,
  ) => {
    const { moduleInstance } = action.payload;
    draftState[moduleInstance.id] = moduleInstance;
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
    draftState = klona(initialState);
    const moduleInstances = action.payload;

    moduleInstances.forEach((moduleInstance: QueryModuleInstance) => {
      draftState[moduleInstance.id] = moduleInstance;
    });

    return draftState;
  },

  [ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_SUCCESS]: (
    draftState: ModuleInstanceReducerState,
    action: ReduxAction<{
      id: ModuleInstanceId;
      newName: string;
    }>,
  ) => {
    const { id, newName } = action.payload;

    draftState[id].name = newName;

    return draftState;
  },
};

const moduleInstanceReducer = createImmerReducer(initialState, handlers);

export default moduleInstanceReducer;
