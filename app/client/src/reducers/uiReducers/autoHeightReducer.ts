import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export type AutoHeightUIStatePayload = {
  isAutoHeightWithLimitsChanging: boolean;
};

export type AutoHeightUIState = {
  isAutoHeightWithLimitsChanging: boolean;
};

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
