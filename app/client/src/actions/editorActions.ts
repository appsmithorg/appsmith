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
    type: ReduxActionTypes.UPDATE_CANVAS_ZOOM_LEVEL,
    payload: zoomLevel,
  };
};

/**
 * action that update editor isPanning flag
 *
 * @param width
 * @param height
 * @returns
 */
export const updateIsPanning = (isPanning: boolean) => {
  return {
    type: ReduxActionTypes.UPDATE_CANVAS_IS_PANNING,
    payload: isPanning,
  };
};

/**
 * action that update editor panningEnabled flag
 *
 * @param width
 * @param height
 * @returns
 */
export const updatePanningEnabled = (panningEnabled: boolean) => {
  return {
    type: ReduxActionTypes.UPDATE_CANVAS_PANNING_ENABLED,
    payload: panningEnabled,
  };
};
/**
 * action that update editor panningAllowed flag
 *
 * @param width
 * @param height
 * @returns
 */
export const updatePanningAllowed = (panningAllowed: boolean) => {
  return {
    type: ReduxActionTypes.UPDATE_CANVAS_PANNING_ALLOWED,
    payload: panningAllowed,
  };
};
