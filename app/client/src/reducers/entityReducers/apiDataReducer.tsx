import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import { ActionResponse } from "../../api/ActionAPI";
import { ActionDataState } from "./actionsReducer";

const initialState: APIDataState = {};

export type APIDataState = Record<string, ActionResponse>;

const apiDataReducer = createReducer(initialState, {
  [ReduxActionTypes.EXECUTE_ACTION_SUCCESS]: (
    state: ActionDataState,
    action: ReduxAction<{ [id: string]: ActionResponse }>,
  ) => ({ ...state, ...action.payload }),
});

export default apiDataReducer;
