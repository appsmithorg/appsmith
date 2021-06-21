import { createReducer } from "utils/AppsmithUtils";
import { JSAction } from "entities/JSAction";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
const initialState: any = [];

export interface JSActionData {
  isLoading: boolean;
  config: JSAction;
  data?: any;
}
export type JSActionDataState = JSActionData[];
export interface PartialActionData {
  isLoading: boolean;
  config: { id: string };
  data?: any;
}

const jsActionsReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS]: (
    state: JSActionDataState,
    action: ReduxAction<JSAction[]>,
  ): any => {
    return action.payload.map((action) => {
      const foundAction = state.find((currentAction) => {
        return currentAction.config.id === action.id;
      });
      return {
        isLoading: false,
        config: action,
        data: foundAction?.data,
      };
    });
  },
  [ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR]: () => initialState,
  [ReduxActionTypes.CREATE_JS_ACTION_INIT]: (
    state: JSActionDataState,
    action: ReduxAction<JSAction>,
  ): JSActionDataState =>
    state.concat([
      {
        config: { ...action.payload, id: action.payload.name },
        isLoading: false,
      },
    ]),
  [ReduxActionTypes.CREATE_JS_ACTION_SUCCESS]: (
    state: JSActionDataState,
    action: ReduxAction<JSAction>,
  ): JSActionDataState =>
    state.map((a) => {
      if (
        a.config.pageId === action.payload.pageId &&
        a.config.id === action.payload.name
      ) {
        return { ...a, config: action.payload };
      }
      return a;
    }),
});

export default jsActionsReducer;
