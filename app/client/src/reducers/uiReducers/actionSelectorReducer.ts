import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "../../actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

export type ActionSelectorReduxState = Record<
  string,
  {
    evaluatedValue: {
      value: string;
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
