import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const initExplorerEntityNameEdit = (actionId: string) => {
  return {
    type: ReduxActionTypes.INIT_EXPLORER_ENTITY_NAME_EDIT,
    payload: {
      id: actionId,
    },
  };
};

/**
 * action that make explorer pin/unpin
 *
 * @param shouldPin
 * @returns
 */
export const setExplorerPinned = (shouldPin: boolean) => {
  return {
    type: ReduxActionTypes.SET_EXPLORER_PINNED,
    payload: {
      shouldPin,
    },
  };
};

/**
 * action that updates explorer width
 *
 * @param shouldPin
 * @returns
 */
export const updateExplorerWidth = (width: number | undefined) => {
  return {
    type: ReduxActionTypes.UPDATE_EXPLORER_WIDTH,
    payload: {
      width,
    },
  };
};
