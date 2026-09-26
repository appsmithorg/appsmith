import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

const initialState: HelpReduxState = {
  modalOpen: false,
  defaultRefinement: "",
};

const helpReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_DEFAULT_REFINEMENT]: (
    state: HelpReduxState,
    action: ReduxAction<string>,
  ) => {
    return { ...state, defaultRefinement: action.payload };
  },
  [ReduxActionTypes.SET_HELP_MODAL_OPEN]: (
    state: HelpReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, modalOpen: action.payload };
  },
});

export interface HelpReduxState {
  modalOpen: boolean;
  defaultRefinement: string;
}

export default helpReducer;
