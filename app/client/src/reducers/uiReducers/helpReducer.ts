import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

const initialState: HelpReduxState = {
  url: "",
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
  url: string;
  modalOpen: boolean;
  defaultRefinement: string;
}

export default helpReducer;
