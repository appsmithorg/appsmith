import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { createImmerReducer } from "utils/ReducerUtils";

export interface SuccessfulBindingsReduxState {
  successfulBindings: Record<string, unknown>;
}

const initialState: SuccessfulBindingsReduxState = {
  successfulBindings: {},
};

const successfulBindingsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.FETCH_PAGE_INIT]: () => initialState,

  [ReduxActionTypes.UPDATE_SUCCESSFULL_BINDINGS_MAP]: (
    state: SuccessfulBindingsReduxState,
    action: ReduxAction<Record<string, unknown>>,
  ) => {
    return {
      successfulBindings: action.payload.successfulBindings,
    };
  },
});

export default successfulBindingsReducer;
