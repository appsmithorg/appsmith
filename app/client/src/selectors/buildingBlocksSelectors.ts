import type { AppState } from "@appsmith/reducers";

export const isDraggingBuildingBlockToCanvas = (state: AppState) =>
  state.ui.buildingBlocks.isDraggingBuildingBlocksToCanvas;
