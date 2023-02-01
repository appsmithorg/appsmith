import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const removeWrappersAction = (parentId: string) => ({
  type: ReduxActionTypes.REMOVE_CHILD_WRAPPERS,
  payload: { parentId },
});

export const addWrappersAction = (parentId: string) => ({
  type: ReduxActionTypes.ADD_CHILD_WRAPPERS,
  payload: {
    parentId,
  },
});

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

export const widgetViolatedMinDimentionsAction = (parentId: string) => ({
  type: ReduxActionTypes.WIDGET_VIOLATED_MIN_DIMENSIONS,
  payload: {
    parentId,
  },
});
