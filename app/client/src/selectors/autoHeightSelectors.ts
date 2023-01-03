import { AppState } from "@appsmith/reducers";

export const getAutoHeightLayoutTree = (state: AppState) =>
  state.entities.autoHeightLayoutTree;

export const getCanvasLevelMap = (state: AppState) =>
  state.entities.canvasLevels;
