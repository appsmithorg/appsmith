import { ReduxActionTypes } from "constants/ReduxActionConstants";

/**
 * action that sets preview mode
 *
 * @param payload
 * @returns
 */

export const setPreviewMode = (payload: boolean) => ({
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
export const updateCanvasLayout = (
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
 * action that update editor zoom level
 *
 * @param width
 * @param height
 * @returns
 */
export const updateZoomLevel = (zoomLevel: number) => {
  return {
    type: ReduxActionTypes.UPDATE_ZOOM_LEVEL,
    payload: zoomLevel,
  };
};
