import type { DefaultRootState } from "react-redux";

export const isDraggingBuildingBlockToCanvas = (state: DefaultRootState) =>
  state.ui.buildingBlocks.isDraggingBuildingBlocksToCanvas;

export const getBuildingBlockDragStartTimestamp = (state: DefaultRootState) =>
  state.ui.buildingBlocks.buildingBlockDragStartTimestamp;
