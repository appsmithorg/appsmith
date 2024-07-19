import type { AppState } from "@appsmith/reducers";

export const isDraggingBuildingBlockToCanvas = (state: AppState) =>
  state.ui.buildingBlocks.isDraggingBuildingBlocksToCanvas;

export const getBuildingBlockDragStartTimestamp = (state: AppState) =>
  state.ui.buildingBlocks.buildingBlockDragStartTimestamp;

export const getCreateBuildingBlockActionStates = (state: AppState) =>
  state.ui.buildingBlocks.createBuildingBlock;

export const customBuildingBlocks = (state: AppState) =>
  state.ui.buildingBlocks.customBuildingBlocks;
