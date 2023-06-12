import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export type AutoLayoutCanvasWidthState = {
  [canvasId: string]: number;
};

export type AutoLayoutCanvasWidthStatePayload = {
  canvasId: string;
  width: number;
};

const initialState: AutoLayoutCanvasWidthState = {};

const autoLayoutCanvasWidthReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_CANVAS_META_WIDTH]: (
    state: AutoLayoutCanvasWidthState,
    action: ReduxAction<AutoLayoutCanvasWidthStatePayload>,
  ) => {
    state[action.payload.canvasId] = action.payload.width;
  },
});

export default autoLayoutCanvasWidthReducer;
