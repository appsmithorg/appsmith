import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

export interface ActionTabsReduxState {
  index: number;
}

const initialState: ActionTabsReduxState = {
  index: 0,
};

const actionTabsReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_ACTION_TABS_INITIAL_INDEX]: (
    state: ActionTabsReduxState,
    action: ReduxAction<number>,
  ) => {
    return {
      ...state,
      index: action.payload,
    };
  },
});

export default actionTabsReducer;
