import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import {
  CONVERSION_STATES,
  SnapShotDetails,
} from "reducers/uiReducers/layoutConversionReducer";

/**
 * Calculate size and position changes owing to minSizes and flex wrap.
 * This function is triggered the first time mobile viewport (480px) is encountered.
 * It is also called when increasing viewport size from mobile to desktop.
 */
export const updateLayoutForMobileBreakpointAction = (
  parentId: string,
  isMobile: boolean,
  canvasWidth: number,
) => {
  return {
    type: ReduxActionTypes.RECALCULATE_COLUMNS,
    payload: {
      parentId,
      isMobile,
      canvasWidth,
    },
  };
};

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

export const setAutoCanvasResizing = (isAutoCanvasResizing: boolean) => {
  return {
    type: ReduxActionTypes.SET_AUTO_CANVAS_RESIZING,
    payload: isAutoCanvasResizing,
  };
};
