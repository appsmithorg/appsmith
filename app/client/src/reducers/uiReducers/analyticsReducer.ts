import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

export type SegmentState = "INIT_SUCCESS" | "INIT_UNCERTAIN";

export const initialState: AnalyticsReduxState = {
  telemetry: {},
  ideCanvasSideBySideHover: {
    navigated: false,
    widgetTypes: [],
  },
};

export interface AnalyticsReduxState {
  telemetry: {
    segmentState?: SegmentState;
  };

  ideCanvasSideBySideHover: {
    navigated: boolean;
    widgetTypes: string[];
  };
}

export const handlers = {
  [ReduxActionTypes.RESET_ANALYTICS_FOR_SIDE_BY_SIDE_HOVER]: (
    state: AnalyticsReduxState,
  ): AnalyticsReduxState => ({
    ...state,
    ideCanvasSideBySideHover: {
      ...initialState.ideCanvasSideBySideHover,
    },
  }),
  [ReduxActionTypes.RECORD_ANALYTICS_FOR_SIDE_BY_SIDE_NAVIGATION]: (
    state: AnalyticsReduxState,
  ): AnalyticsReduxState => ({
    ...state,
    ideCanvasSideBySideHover: {
      ...state.ideCanvasSideBySideHover,
      navigated: true,
    },
  }),
  [ReduxActionTypes.RECORD_ANALYTICS_FOR_SIDE_BY_SIDE_WIDGET_HOVER]: (
    state: AnalyticsReduxState,
    action: ReduxAction<string>,
  ): AnalyticsReduxState => ({
    ...state,
    ideCanvasSideBySideHover: {
      ...state.ideCanvasSideBySideHover,
      widgetTypes: [
        ...state.ideCanvasSideBySideHover.widgetTypes,
        action.payload,
      ],
    },
  }),
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
