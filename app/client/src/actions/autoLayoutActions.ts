import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import type {
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
  widgets?: CanvasWidgetsReduxState,
) => {
  return {
    type: ReduxActionTypes.RECALCULATE_COLUMNS,
    payload: {
      parentId,
      isMobile,
      canvasWidth,
      widgets,
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

export const setConversionStart = (conversionState: CONVERSION_STATES) => {
  return {
    type: ReduxActionTypes.START_CONVERSION_FLOW,
    payload: conversionState,
  };
};

export const setConversionStop = () => {
  return {
    type: ReduxActionTypes.STOP_CONVERSION_FLOW,
  };
};

export const setAutoCanvasResizing = (isAutoCanvasResizing: boolean) => {
  return {
    type: ReduxActionTypes.SET_AUTO_CANVAS_RESIZING,
    payload: isAutoCanvasResizing,
  };
};
