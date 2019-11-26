import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { ActionResponse } from "api/ActionAPI";
import { ActionDataState } from "./actionsReducer";
import _ from "lodash";

const initialState: APIDataState = {};

export type APIDataState = Record<string, ActionResponse>;

const apiDataReducer = createReducer(initialState, {
  [ReduxActionTypes.EXECUTE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ [id: string]: ActionResponse }>,
  ) => ({ ...state, ...action.payload }),
  [ReduxActionTypes.RUN_API_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ [id: string]: ActionResponse }>,
  ) => ({ ...state, ...action.payload }),
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ id: string }>,
  ) => _.omit(state, action.payload.id),
});

export default apiDataReducer;
