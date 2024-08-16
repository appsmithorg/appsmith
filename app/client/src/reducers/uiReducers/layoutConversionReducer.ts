import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";

export enum AlertType {
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

export enum CONVERSION_STATES {
  START = "START",
  CONFIRM_CONVERSION = "CONFIRM_CONVERSION",
  SNAPSHOT_SPINNER = "SNAPSHOT_SPINNER",
  CONVERSION_SPINNER = "CONVERSION_SPINNER",
  COMPLETED_SUCCESS = "COMPLETED_SUCCESS",
  COMPLETED_WARNING = "COMPLETED_WARNING",
  COMPLETED_ERROR = "COMPLETED_ERROR",
  SNAPSHOT_START = "SNAPSHOT_START",
  DISCARD_SNAPSHOT = "DISCARD_SNAPSHOT",
  RESTORING_SNAPSHOT_SPINNER = "RESTORING_SNAPSHOT_SPINNER",
}

export interface SnapshotDetails {
  updatedTime: string;
}

const initialState: layoutConversionReduxState = {
  snapshotDetails: undefined,
  conversionError: undefined,
  conversionState: CONVERSION_STATES.START,
  isConverting: false,
};

const layoutConversionReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_LAYOUT_CONVERSION_STATE]: (
    state: layoutConversionReduxState,
    action: ReduxAction<{ conversionState: CONVERSION_STATES; error: Error }>,
  ) => {
    state.conversionState = action.payload.conversionState;
    if (action.payload.error) {
      state.conversionError = action.payload.error;
    }
  },
  [ReduxActionTypes.START_CONVERSION_FLOW]: (
    state: layoutConversionReduxState,
    action: ReduxAction<CONVERSION_STATES>,
  ) => {
    state.conversionState = action.payload;
    state.conversionError = undefined;
    state.isConverting = true;
  },
  [ReduxActionTypes.STOP_CONVERSION_FLOW]: (
    state: layoutConversionReduxState,
  ) => {
    state.isConverting = false;
    state.conversionError = undefined;
  },
  [ReduxActionTypes.UPDATE_SNAPSHOT_DETAILS]: (
    state: layoutConversionReduxState,
    action: ReduxAction<SnapshotDetails | undefined>,
  ) => {
    state.snapshotDetails = action.payload;
  },
});

export interface layoutConversionReduxState {
  snapshotDetails: SnapshotDetails | undefined;
  conversionError: Error | undefined;
  conversionState: CONVERSION_STATES;
  isConverting: boolean;
}

export default layoutConversionReducer;
