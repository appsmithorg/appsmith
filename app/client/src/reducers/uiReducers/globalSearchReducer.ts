import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: GlobalSearchReduxState = {
  helpResults: [],
  query: "",
  modalOpen: false,
  activeItemIndex: 0,
};

const globalSearchReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_GLOBAL_SEARCH_QUERY]: (
    state: GlobalSearchReduxState,
    action: ReduxAction<string>,
  ) => ({ ...state, query: action.payload }),
  [ReduxActionTypes.UPDATE_GLOBAL_SEARCH_ACTIVE_ITEM_INDEX]: (
    state: GlobalSearchReduxState,
    action: ReduxAction<number>,
  ) => ({ ...state, activeItemIndex: action.payload }),
  [ReduxActionTypes.SET_HELP_RESULTS]: (
    state: GlobalSearchReduxState,
    action: ReduxAction<Record<string, any>[]>,
  ) => ({ ...state, helpResults: action.payload, activeItemIndex: 0 }),
  [ReduxActionTypes.TOGGLE_SHOW_GLOBAL_SEARCH_MODAL]: (
    state: GlobalSearchReduxState,
  ) => ({ ...state, modalOpen: !state.modalOpen }),
});

export interface GlobalSearchReduxState {
  helpResults: any[];
  query: string;
  modalOpen: boolean;
  activeItemIndex: number;
  // entity: any;
}

export default globalSearchReducer;
