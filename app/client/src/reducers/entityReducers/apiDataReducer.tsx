import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import { ActionApiResponse } from "../../api/ActionAPI";
import { ActionDataState } from "./actionsReducer";

const initialState: APIDataState = {};

export interface APIDataState {
  [id: string]: ActionApiResponse;
}

const apiDataReducer = createReducer(initialState, {
  [ReduxActionTypes.EXECUTE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ [id: string]: ActionApiResponse }>,
  ) => ({ ...state, ...action.payload }),
});

export default apiDataReducer;
