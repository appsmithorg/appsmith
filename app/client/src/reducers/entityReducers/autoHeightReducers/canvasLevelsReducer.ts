import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { AutoHeightLayoutTreePayload } from "./autoHeightLayoutTreeReducer";

export type CanvasLevelsPayload = Record<string, number>;

export interface CanvasLevelsReduxState {
  [widgetId: string]: number;
}

const initialState: CanvasLevelsReduxState = {};

const canvasLevelsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_AUTO_HEIGHT_LAYOUT_TREE]: (
    state: CanvasLevelsReduxState,
    action: ReduxAction<AutoHeightLayoutTreePayload>,
  ) => {
    const { canvasLevelMap } = action.payload;

    for (const widgetId in canvasLevelMap) {
      if (state[widgetId] !== canvasLevelMap[widgetId])
        state[widgetId] = canvasLevelMap[widgetId];
    }
  },
});

export default canvasLevelsReducer;
