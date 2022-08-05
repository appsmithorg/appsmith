import { createReducer } from "utils/ReducerUtils";
import {
  ReduxActionErrorTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";

export type JSExecutionRecord = Record<string, string>;
const initialState: JSExecutionRecord = {};
const jsExecutionsReducer = createReducer(initialState, {
  [ReduxActionErrorTypes.SAVE_JS_EXECUTION_RECORD]: (
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
