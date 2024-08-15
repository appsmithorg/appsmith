import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import produce, { type Draft } from "immer";
import type { Reducer } from "redux";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Action = ReduxAction<any>;

export const createReducer = <T>(
  initialState: T,
  handlers: { [type: string]: (state: T, action: Action) => T },
): Reducer<T, Action> => {
  return function reducer(state = initialState, action: Action): T {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    } else {
      return state;
    }
  };
};

export const createImmerReducer = <T>(
  initialState: T,
  handlers: {
    [type: string]: (state: Draft<T>, action: Action) => T | void;
  },
) => {
  return function reducer(state = initialState, action: Action) {
    if (handlers.hasOwnProperty(action.type)) {
      return produce(state, (draft: unknown) => {
        return handlers[action.type](draft as Draft<T>, action);
      });
    } else {
      return state;
    }
  };
};
