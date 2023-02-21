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

export const widgetViolatedMinDimentionsAction = (parentId: string) => ({
  type: ReduxActionTypes.WIDGET_VIOLATED_MIN_DIMENSIONS,
  payload: {
    parentId,
  },
});

export function updateWidgetDimensionAction(
  widgetId: string,
  width: number,
  height: number,
) {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_DIMENSIONS,
    payload: {
      widgetId,
      width,
      height,
    },
  };
}
