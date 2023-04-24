import type { AppState } from "ce/reducers";

export const getSegmentState = (state: AppState) =>
  state.ui.analytics.telemetry.segmentState;
