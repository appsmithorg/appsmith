import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: HelpReduxState = {
  url: "",
  modalOpen: false,
  height: 243,
  width: 245,
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
  url: string;
  modalOpen: boolean;
  height: number;
  width: number;
  defaultRefinement: string;
}

export default helpReducer;
