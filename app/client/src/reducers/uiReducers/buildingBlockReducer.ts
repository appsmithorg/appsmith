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
});

export interface BuildingBlocksReduxState {
  isDraggingBuildingBlocksToCanvas: boolean;
}

export default buildingBlockReducer;
