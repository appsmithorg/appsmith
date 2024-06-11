import type { AppState } from "@appsmith/reducers";

export const getSegmentState = (state: AppState) =>
  state.ui.analytics.telemetry.segmentState;

export const getIdeCanvasSideBySideHoverState = (state: AppState) =>
  state.ui.analytics.ideCanvasSideBySideHover;
