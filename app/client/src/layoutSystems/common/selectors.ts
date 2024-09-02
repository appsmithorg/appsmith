import type { AppState } from "ee/reducers";
import { createSelector } from "reselect";

export const getLayoutElementPositions = (state: AppState) =>
  state.entities.layoutElementPositions;

export const getPositionsByLayoutId = (layoutId: string) =>
  createSelector(
    getLayoutElementPositions,
    (layoutElementPositions) => layoutElementPositions[layoutId],
  );
