import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import { ExecuteActionResponse } from "../../api/ActionAPI";

const initialState: QueryDataState = {};

export interface QueryDataState {
  [name: string]: ExecuteActionResponse;
}

const queryDataReducer = createReducer(initialState, {
  [ReduxActionTypes.LOAD_API_RESPONSE]: (
    state: QueryDataState,
    action: ReduxAction<ExecuteActionResponse>,
  ) => {
    return { ...state, [action.payload.actionId]: action.payload };
  },
});

export default queryDataReducer;
