import type { AppState } from "@appsmith/reducers";

export const getLayoutElementPositions = (state: AppState) =>
  state.entities.layoutElementPositions;
