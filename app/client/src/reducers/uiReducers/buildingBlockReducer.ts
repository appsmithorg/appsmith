import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

const initialState: BuildingBlocksReduxState = {
  isDraggingBuildingBlocksToCanvas: false,
};

const buildingBlockReducer = createReducer(initialState, {
  [ReduxActionTypes.DRAGGING_BUILDING_BLOCK_TO_CANVAS_INIT]: (
    state: BuildingBlocksReduxState,
  ): BuildingBlocksReduxState => {
    return {
      ...state,
      isDraggingBuildingBlocksToCanvas: true,
    };
  },
  [ReduxActionTypes.DRAGGING_BUILDING_BLOCK_TO_CANVAS_SUCCESS]: (
    state: BuildingBlocksReduxState,
  ): BuildingBlocksReduxState => {
    return {
      ...state,
      isDraggingBuildingBlocksToCanvas: false,
    };
  },
  [ReduxActionErrorTypes.DRAGGING_BUILDING_BLOCK_TO_CANVAS_ERROR]: (
    state: BuildingBlocksReduxState,
  ): BuildingBlocksReduxState => {
    return {
      ...state,
      isDraggingBuildingBlocksToCanvas: false,
    };
  },
  [ReduxActionTypes.SET_BUILDING_BLOCK_DRAG_START_TIME]: (
    state: BuildingBlocksReduxState,
    action: ReduxAction<{ startTime: number }>,
  ): BuildingBlocksReduxState => {
    return {
      ...state,
      buildingBlockDragStartTimestamp: action.payload.startTime,
    };
  },
  [ReduxActionTypes.RESET_BUILDING_BLOCK_DRAG_START_TIME]: (
    state: BuildingBlocksReduxState,
  ): BuildingBlocksReduxState => {
    return {
      ...state,
      buildingBlockDragStartTimestamp: undefined,
    };
  },
});

export interface BuildingBlocksReduxState {
  isDraggingBuildingBlocksToCanvas: boolean;
  buildingBlockDragStartTimestamp?: number;
}

export default buildingBlockReducer;
