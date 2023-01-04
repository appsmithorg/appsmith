import { AppState } from "ce/reducers";

export const getIsSegmentInitialized = (state: AppState) =>
  state.ui.analytics.telemetry.isSegmentInitialized;
