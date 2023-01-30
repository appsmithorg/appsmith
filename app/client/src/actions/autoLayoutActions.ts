import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";

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

export const updateLayoutPositioning = (
  positioningType: AppPositioningTypes,
) => {
  return {
    type: ReduxActionTypes.UPDATE_LAYOUT_POSITIONING,
    payload: positioningType,
  };
};
