import type { AppState } from "ee/reducers";

export const isDraggingBuildingBlockToCanvas = (state: AppState) =>
  state.ui.buildingBlocks.isDraggingBuildingBlocksToCanvas;

export const getBuildingBlockDragStartTimestamp = (state: AppState) =>
  state.ui.buildingBlocks.buildingBlockDragStartTimestamp;
