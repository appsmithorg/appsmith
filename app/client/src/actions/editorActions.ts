import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

/**
 * action that sets preview mode
 *
 * @param payload
 * @returns
 */

export const setPreviewModeAction = (payload: boolean) => ({
  type: ReduxActionTypes.SET_PREVIEW_MODE,
  payload,
});

/**
 * action that sets visibility state of the canvas top section
 *
 * @param payload
 * @returns
 */
export const setCanvasCardsState = (payload: string) => ({
  type: ReduxActionTypes.SET_CANVAS_CARDS_STATE,
  payload,
});
/**
 * action that deletes/clears the visibility state of the canvas top section
 *
 * @param payload
 * @returns
 */
export const deleteCanvasCardsState = () => ({
  type: ReduxActionTypes.DELETE_CANVAS_CARDS_STATE,
});

/**
 * action that update canvas layout
 *
 * @param width
 * @returns
 */
export const updateCanvasLayoutAction = (width: number) => {
  return {
    type: ReduxActionTypes.UPDATE_CANVAS_LAYOUT,
    payload: {
      width,
    },
  };
};

/**
 * This action when executed updates the status of saving entity to true
 * This function was created to add a sync to the entity update and shortcut command being fired to execute any command.
 */

export const startingEntityUpdate = () => ({
  type: ReduxActionTypes.ENTITY_UPDATE_STARTED,
});
