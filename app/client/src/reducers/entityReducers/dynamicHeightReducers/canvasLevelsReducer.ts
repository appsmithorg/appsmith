import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { DynamicHeightLayoutTreePayload } from "./dynamicHeightLayoutTreeReducer";

export type CanvasLevelsPayload = Record<string, number>;

export type CanvasLevelsReduxState = {
  [widgetId: string]: number;
};

const initialState: CanvasLevelsReduxState = {};

const canvasLevelsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_DYNAMIC_HEIGHT_LAYOUT_TREE]: (
    state: CanvasLevelsReduxState,
    action: ReduxAction<DynamicHeightLayoutTreePayload>,
  ) => {
    const { canvasLevelMap } = action.payload;
    console.log("Dynamic Height: Updating reducer canvasLevels", {
      canvasLevelMap,
    });
    for (const widgetId in canvasLevelMap) {
      if (state[widgetId] !== canvasLevelMap[widgetId])
        state[widgetId] = canvasLevelMap[widgetId];
    }
  },
});

export default canvasLevelsReducer;
