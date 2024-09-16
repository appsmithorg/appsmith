import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

export type SegmentState = "INIT_SUCCESS" | "INIT_UNCERTAIN";

export const initialState: AnalyticsReduxState = {
  telemetry: {},
};

export interface AnalyticsReduxState {
  telemetry: {
    segmentState?: SegmentState;
  };
}

export const handlers = {
  [ReduxActionTypes.SEGMENT_INITIALIZED]: (
    state: AnalyticsReduxState,
  ): AnalyticsReduxState => ({
    ...state,
    telemetry: {
      ...state.telemetry,
      segmentState: "INIT_SUCCESS",
    },
  }),
  [ReduxActionTypes.SEGMENT_INIT_UNCERTAIN]: (
    state: AnalyticsReduxState,
  ): AnalyticsReduxState => ({
    ...state,
    telemetry: {
      ...state.telemetry,
      segmentState: "INIT_UNCERTAIN",
    },
  }),
};

export default createReducer(initialState, handlers);
