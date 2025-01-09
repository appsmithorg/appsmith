import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "../../actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export interface AutoHeightUIStatePayload {
  isAutoHeightWithLimitsChanging: boolean;
}

export interface AutoHeightUIState {
  isAutoHeightWithLimitsChanging: boolean;
}

const initialState: AutoHeightUIState = {
  isAutoHeightWithLimitsChanging: false,
};

const autoHeightUIReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_AUTO_HEIGHT_WITH_LIMITS_CHANGING]: (
    state: AutoHeightUIState,
    action: ReduxAction<AutoHeightUIStatePayload>,
  ) => {
    state.isAutoHeightWithLimitsChanging =
      action.payload.isAutoHeightWithLimitsChanging;
  },
});

export default autoHeightUIReducer;
