import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

const initialState: CanvasCodeState = {
  tab: "CANVAS",
};

const canvasCodeReducer = createReducer(initialState, {
  [ReduxActionTypes.CANVAS_CODE_TOGGLE]: (
    state: CanvasCodeState,
    action: ReduxAction<string | undefined>,
  ) => {
    if (!action.payload) {
      return {
        ...state,
        tab: state.tab === "CANVAS" ? "CODE" : "CANVAS",
      };
    }

    return { ...state, tab: action.payload };
  },
});

export interface CanvasCodeState {
  tab: "CANVAS" | "CODE";
}

export default canvasCodeReducer;
