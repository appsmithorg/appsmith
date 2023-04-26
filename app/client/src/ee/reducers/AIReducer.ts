import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

export interface AIReduxState {
  isAIWindowOpen: boolean;
}

const initialGPTState: AIReduxState = {
  isAIWindowOpen: false,
};

const handlers = {
  [ReduxActionTypes.TOGGLE_AI_WINDOW]: (
    state: AIReduxState,
    action: ReduxAction<boolean>,
  ): AIReduxState => ({
    ...state,
    isAIWindowOpen: action.payload,
  }),
};

export default createReducer(initialGPTState, handlers);
