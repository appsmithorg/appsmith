import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { LayoutSystemTypes } from "layoutSystems/types";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer.types";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer.types";
import type { SnapshotDetails } from "reducers/uiReducers/layoutConversionReducer.types";

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

export const updateLayoutSystemType = (layoutSystemType: LayoutSystemTypes) => {
  return {
    type: ReduxActionTypes.UPDATE_LAYOUT_SYSTEM_TYPE,
    payload: layoutSystemType,
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
  snapshotDetails: SnapshotDetails | undefined,
) => {
  return {
    type: ReduxActionTypes.UPDATE_SNAPSHOT_DETAILS,
    payload: snapshotDetails,
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

export const fetchSnapshotDetailsAction = () => {
  return {
    type: ReduxActionTypes.FETCH_LAYOUT_SNAPSHOT_DETAILS,
  };
};

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

export const updatePositionsOnTabChange = (
  widgetId: string,
  selectedTabWidgetId: string,
) => {
  return {
    type: ReduxActionTypes.UPDATE_POSITIONS_ON_TAB_CHANGE,
    payload: { selectedTabWidgetId, widgetId },
  };
};
