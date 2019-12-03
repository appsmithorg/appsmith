import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";

export type JSExecutionRecord = Record<string, string>;
const initialState: JSExecutionRecord = {};
const jsExecutionsReducer = createReducer(initialState, {
  [ReduxActionTypes.SAVE_JS_EXECUTION_RECORD]: (
    state: JSExecutionRecord,
    action: ReduxAction<JSExecutionRecord>,
  ) => {
    return {
      ...state,
      ...action.payload,
    };
  },
});

export default jsExecutionsReducer;
