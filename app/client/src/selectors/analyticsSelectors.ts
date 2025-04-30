import type { DefaultRootState } from "react-redux";

export const getSegmentState = (state: DefaultRootState) =>
  state.ui.analytics.telemetry.segmentState;
