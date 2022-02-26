import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: ConfirmRunActionReduxState = {
  modalOpen: false,
};

const confirmRunActionReducer = createReducer(initialState, {
  [ReduxActionTypes.SHOW_ACTION_MODAL]: (
    state: ConfirmRunActionReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, modalOpen: action.payload };
  },
});

export interface ConfirmRunActionReduxState {
  modalOpen: boolean;
}

export default confirmRunActionReducer;
