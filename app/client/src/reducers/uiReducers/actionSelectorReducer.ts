import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export type ActionSelectorReduxState = Record<
  string,
  {
    evaluatedValue: {
      value: string;
      errors: any[];
    };
  }
>;

const initialState: ActionSelectorReduxState = {};

const actionSelectorReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_EVALUATED_ACTION_SELECTOR_FIELD]: (
    state: ActionSelectorReduxState,
    action: ReduxAction<
      ActionSelectorReduxState["evaluatedValue"] & { id: string }
    >,
  ) => ({
    ...state,
    [action.payload.id]: { evaluatedValue: action.payload.evaluatedValue },
  }),
  [ReduxActionTypes.CLEAR_EVALUATED_ACTION_SELECTOR_FIELD]: (
    state: ActionSelectorReduxState,
    action: ReduxAction<string>,
  ) => {
    const newState = { ...state };
    delete newState[action.payload];
    return newState;
  },
});

export default actionSelectorReducer;
