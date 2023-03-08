import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

/**
 * Calculate size and position changes owing to minSizes and flex wrap.
 * This function is triggered the first time mobile viewport (480px) is encountered.
 * It is also called when increasing viewport size from mobile to desktop.
 */
export const updateLayoutForMobileBreakpointAction = (
  parentId: string,
  isMobile: boolean,
  canvasWidth: number,
) => ({
  type: ReduxActionTypes.RECALCULATE_COLUMNS,
  payload: {
    parentId,
    isMobile,
    canvasWidth,
  },
});

export const setAutoCanvasResizing = (isAutoCanvasResizing: boolean) => {
  return {
    type: ReduxActionTypes.SET_AUTO_CANVAS_RESIZING,
    payload: isAutoCanvasResizing,
  };
};
