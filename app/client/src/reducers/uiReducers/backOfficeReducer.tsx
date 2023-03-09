import { createReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";

const initialState: BackOfficeReduxState = {
  isBackOfficeConnected: false,
  isBackOfficeModalOpen: false,
};

const backOfficeReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_BACK_OFFICE_CONNECTED]: (
    state: BackOfficeReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return { ...state, isBackOfficeConnected: action.payload };
  },
  [ReduxActionTypes.SET_IS_BACK_OFFICE_MODAL_OPEN]: (
    state: BackOfficeReduxState,
    action: ReduxAction<boolean>,
  ) => {
    // eslint-disable-next-line no-console
    console.log("Reducer SET_IS_BACK_OFFICE_MODAL_OPEN:", state);
    return { ...state, isBackOfficeModalOpen: action.payload };
  },
});

export interface BackOfficeReduxState {
  isBackOfficeModalOpen: boolean;
  isBackOfficeConnected: boolean;
}

export default backOfficeReducer;
