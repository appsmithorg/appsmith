import type { DefaultRootState } from "react-redux";

export const getAutoHeightLayoutTree = (state: DefaultRootState) =>
  state.entities.autoHeightLayoutTree;

export const getCanvasLevelMap = (state: DefaultRootState) =>
  state.entities.canvasLevels;
