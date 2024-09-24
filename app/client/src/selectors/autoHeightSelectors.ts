import type { AppState } from "ee/reducers";

export const getAutoHeightLayoutTree = (state: AppState) =>
  state.entities.autoHeightLayoutTree;

export const getCanvasLevelMap = (state: AppState) =>
  state.entities.canvasLevels;
