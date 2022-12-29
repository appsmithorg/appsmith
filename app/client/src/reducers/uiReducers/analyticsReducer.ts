import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

export const initialState: AnalyticsReduxState = {
  telemetry: {
    isSegmentInitialized: false,
  },
};

export interface AnalyticsReduxState {
  telemetry: {
    isSegmentInitialized: boolean;
  };
}

export const handlers = {
  [ReduxActionTypes.SEGMENT_INITIALIZED]: (
    state: AnalyticsReduxState,
  ): AnalyticsReduxState => ({
    ...state,
    telemetry: {
      ...state.telemetry,
      isSegmentInitialized: true,
    },
  }),
};

export default createReducer(initialState, handlers);
