import { createImmerReducer } from "utils/ReducerUtils";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ReduxAction } from "actions/ReduxActionTypes";

export interface WindowDimensionsState {
  height: number;
  width: number;
}

const initialState: WindowDimensionsState = {
  height: typeof window !== "undefined" ? window.innerHeight : 0,
  width: typeof window !== "undefined" ? window.innerWidth : 0,
};

const windowReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.UPDATE_WINDOW_DIMENSIONS]: (
    state: WindowDimensionsState,
    action: ReduxAction<{ height: number; width: number }>,
  ) => {
    state.height = action.payload.height;
    state.width = action.payload.width;
  },
});

export default windowReducer;
