import type { ReduxAction } from "constants/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

const initialState: BuildingBlocksReduxState = {
  isDraggingBuildingBlocksToCanvas: false,
};

const buildingBlockReducer = createReducer(initialState, {
  [ReduxActionTypes.DRAGGING_BUILDING_BLOCK_TO_CANVAS_INIT]: (
    state: BuildingBlocksReduxState,
  ) => {
    return {
      ...state,
      isDraggingBuildingBlockToCanvas: true,
    };
  },
  [ReduxActionTypes.DRAGGING_BUILDING_BLOCK_TO_CANVAS_SUCCESS]: (
    state: BuildingBlocksReduxState,
  ) => {
    return {
      ...state,
      isDraggingBuildingBlockToCanvas: false,
    };
  },
  [ReduxActionErrorTypes.DRAGGING_BUILDING_BLOCK_TO_CANVAS_ERROR]: (
    state: BuildingBlocksReduxState,
  ) => {
    return {
      ...state,
      isDraggingBuildingBlockToCanvas: false,
    };
  },
  [ReduxActionTypes.SET_BUILDING_BLOCK_DRAG_START_TIME]: (
    state: BuildingBlocksReduxState,
    action: ReduxAction<{ startTime: number }>,
  ) => {
    return {
      ...state,
      buildingBlockDragStartTimestamp: action.payload.startTime,
    };
  },
  [ReduxActionTypes.RESET_BUILDING_BLOCK_DRAG_START_TIME]: (
    state: BuildingBlocksReduxState,
  ) => {
    return {
      ...state,
      buildingBlockDragStartTimestamp: null,
    };
  },
});

export interface BuildingBlocksReduxState {
  isDraggingBuildingBlocksToCanvas: boolean;
  buildingBlockDragStartTimestamp?: number;
}

export default buildingBlockReducer;
