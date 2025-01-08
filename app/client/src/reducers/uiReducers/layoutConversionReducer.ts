import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";

import { AlertType, CONVERSION_STATES } from "./layoutConversionReducer.types";
import type { SnapshotDetails, layoutConversionReduxState } from "./layoutConversionReducer.types";

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

import type { layoutConversionReduxState } from "./layoutConversionReducer.types";

export default layoutConversionReducer;
