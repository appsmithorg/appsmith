import { ReduxActionTypes } from "constants/ReduxActionConstants";

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
