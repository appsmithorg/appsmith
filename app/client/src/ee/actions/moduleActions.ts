import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Module } from "@appsmith/constants/ModuleConstants";

export interface SaveModulePayload extends Module {
  newName: string;
}

export interface DeleteModulePayload {
  id: string;
  onSuccess?: () => void;
}

export const saveModuleName = (payload: SaveModulePayload) => {
  return {
    type: ReduxActionTypes.SAVE_MODULE_NAME_INIT,
    payload,
  };
};

export const deleteModule = (payload: DeleteModulePayload) => {
  return {
    type: ReduxActionTypes.DELETE_QUERY_MODULE_INIT,
    payload,
  };
};
