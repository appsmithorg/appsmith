import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

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
