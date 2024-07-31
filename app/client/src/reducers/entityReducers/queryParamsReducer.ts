import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface QueryParamsReducerState {
  [id: string]: any;
}

const initialState: QueryParamsReducerState = {};

const queryParamsReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_QUERY_PARAMS]: (
    state: QueryParamsReducerState,
    action: ReduxAction<{ id: string; form: any }>,
  ) => {
    return {
      ...state,
      [action.payload.id]: action.payload.form,
    };
  },
});

export default queryParamsReducer;
