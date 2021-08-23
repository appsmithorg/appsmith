import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: CrudInfoModalReduxState = {
  crudInfoModalOpen: true,
};

const crudInfoModalReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_CRUD_INFO_MODAL_OPEN]: (
    state: CrudInfoModalReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, crudInfoModalOpen: action.payload };
  },
});

export interface CrudInfoModalReduxState {
  crudInfoModalOpen: boolean;
}

export default crudInfoModalReducer;
