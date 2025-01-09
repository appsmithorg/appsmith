import type { AppState } from "ee/reducers";

export const getSegmentState = (state: AppState) =>
  state.ui.analytics.telemetry.segmentState;
