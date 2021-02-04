import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: GlobalSearchReduxState = {
  query: "",
  modalOpen: false,
};

const globalSearchReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_GLOBAL_SEARCH_QUERY]: (
    state: GlobalSearchReduxState,
    action: ReduxAction<string>,
  ) => ({ ...state, query: action.payload }),
  [ReduxActionTypes.TOGGLE_SHOW_GLOBAL_SEARCH_MODAL]: (
    state: GlobalSearchReduxState,
  ) => ({ ...state, modalOpen: !state.modalOpen }),
});

export interface GlobalSearchReduxState {
  query: string;
  modalOpen: boolean;
}

export default globalSearchReducer;
