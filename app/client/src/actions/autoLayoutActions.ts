import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  CONVERSION_STATES,
  SnapShotDetails,
} from "reducers/uiReducers/layoutConversionReducer";

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

export const setLayoutConversionStateAction = (
  conversionState: CONVERSION_STATES,
  error?: Error,
) => {
  return {
    type: ReduxActionTypes.SET_LAYOUT_CONVERSION_STATE,
    payload: { conversionState, error },
  };
};

export const updateSnapshotDetails = (
  snapShotDetails: SnapShotDetails | undefined,
) => {
  return {
    type: ReduxActionTypes.UPDATE_SNAPSHOT_DETAILS,
    payload: snapShotDetails,
  };
};
