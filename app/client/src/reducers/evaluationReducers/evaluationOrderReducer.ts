import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export type EvaluationOrderState = string[][];

const initialState: EvaluationOrderState = [];

const evaluationOrderReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_LAST_EVALUATION_ORDER]: (
    state: EvaluationOrderState,
    action: ReduxAction<string[]>,
  ) => {
    // Adds the new evaluation order at the start of the list
    state.unshift(action.payload);
    // We only keep the last five evaluation orders
    if (state.length > 5) {
      state.pop();
    }
  },
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,
});

export default evaluationOrderReducer;
