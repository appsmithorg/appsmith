import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const initExplorerEntityNameEdit = (actionId: string) => {
  return {
    type: ReduxActionTypes.INIT_EXPLORER_ENTITY_NAME_EDIT,
    payload: {
      id: actionId,
    },
  };
};
