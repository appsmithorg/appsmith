import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { CurrentFocusedEntityInfo } from "reducers/uiReducers/editorReducer";

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
 * action that update canvas layout
 *
 * @param width
 * @param height
 * @returns
 */
export const updateCanvasLayoutAction = (
  width: number,
  height: number | undefined,
) => {
  return {
    type: ReduxActionTypes.UPDATE_CANVAS_LAYOUT,
    payload: {
      height,
      width,
    },
  };
};

/**
 * This action when executed updates the status of saving entity to true
 * This function was created to add a sync to the entity update and shortcut command being fired to execute any command.
 */

export const startingEntityUpdation = () => ({
  type: ReduxActionTypes.ENTITY_UPDATE_STARTED,
});
