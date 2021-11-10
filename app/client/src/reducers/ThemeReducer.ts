import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ReducerAction } from "react";
import { AppState } from "reducers";
import { createReducer } from "utils/AppsmithUtils";

export type ThemeReduxState = any;

export const initialState = {};

export default createReducer(initialState, {
  [ReduxActionTypes.SAVE_THEME]: (
    state: ThemeReduxState,
    action: ReducerAction<any>,
  ) => {
    return {
      ...state,
      ...(action as any).payload,
    };
  },
});
