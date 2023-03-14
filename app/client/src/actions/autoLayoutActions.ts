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
