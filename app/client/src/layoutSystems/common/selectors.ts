import type { DefaultRootState } from "react-redux";
import { createSelector } from "reselect";

export const getLayoutElementPositions = (state: DefaultRootState) =>
  state.entities.layoutElementPositions;

export const getPositionsByLayoutId = (layoutId: string) =>
  createSelector(
    getLayoutElementPositions,
    (layoutElementPositions) => layoutElementPositions[layoutId],
  );
