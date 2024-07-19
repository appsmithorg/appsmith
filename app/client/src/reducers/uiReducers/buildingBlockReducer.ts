import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

const initialState: BuildingBlocksReduxState = {
  isDraggingBuildingBlocksToCanvas: false,
  createBuildingBlock: {
    isCreateBuildingBlockModalOpen: false,
    isLoadingCreateBuildingBlock: false,
    isDoneLoadingCreateBuildingBlock: false,
  },
  customBuildingBlocks: [],
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
  [ReduxActionTypes.CREATE_BUILDING_BLOCK_MODAL_OPEN]: (
    state: BuildingBlocksReduxState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    createBuildingBlock: {
      ...state.createBuildingBlock,
      isCreateBuildingBlockModalOpen: action.payload,
    },
  }),
  [ReduxActionTypes.FETCH_CUSTOM_BBS_SUCCESS]: (
    state: BuildingBlocksReduxState,
    action: ReduxAction<any>,
  ) => ({
    ...state,
    customBuildingBlocks: action.payload,
  }),
});

export interface BuildingBlocksReduxState {
  isDraggingBuildingBlocksToCanvas: boolean;
  buildingBlockDragStartTimestamp?: number;
  createBuildingBlock: {
    isCreateBuildingBlockModalOpen: boolean;
    isLoadingCreateBuildingBlock: boolean;
    isDoneLoadingCreateBuildingBlock: boolean;
  };
  customBuildingBlocks: any[];
}

export default buildingBlockReducer;
