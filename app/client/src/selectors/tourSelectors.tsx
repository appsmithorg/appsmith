import type { AppState } from "ee/reducers";

export const getActiveTourIndex = (state: AppState) =>
  state.ui.tour?.activeTourIndex;

export const getActiveTourType = (state: AppState) =>
  state.ui.tour?.activeTourType;
