import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface SaveModulePayload {
  id: string;
  publicEntityId: string;
  newName: string;
}

export const saveModuleName = (payload: SaveModulePayload) => {
  return {
    type: ReduxActionTypes.SAVE_MODULE_NAME_INIT,
    payload,
  };
};
