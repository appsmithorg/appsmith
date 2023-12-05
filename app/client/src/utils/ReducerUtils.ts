import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import produce, { Immutable } from "immer";

export type ActionHandlers<T> = Record<
  string,
  (state: T, action: ReduxAction<any>) => T
>;

export type ImmerActionHandlers<T> = Record<
  string,
  (state: T, action: ReduxAction<any>) => unknown
>;

export const createReducer = <T>(
  initialState: T,
  handlers: ActionHandlers<T>,
) => {
  return function reducer(state = initialState, action: ReduxAction<any>) {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    } else {
      return state;
    }
  };
};

export const createImmerReducer = <T>(
  initialState: T,
  handlers: ImmerActionHandlers<T>,
) => {
  return function reducer(state = initialState, action: ReduxAction<any>) {
    if (handlers.hasOwnProperty(action.type)) {
      return produce(handlers[action.type])(state as Immutable<T>, action);
    } else {
      return state;
    }
  };
};
