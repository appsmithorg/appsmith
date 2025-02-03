import type { ReduxAction } from "actions/ReduxActionTypes";
import { create } from "mutative";

export const createReducer = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialState: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlers: { [type: string]: (state: any, action: any) => any },
) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function reducer(state = initialState, action: ReduxAction<any>) {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    } else {
      return state;
    }
  };
};

export const createImmerReducer = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialState: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlers: { [type: string]: any },
) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function reducer(state = initialState, action: ReduxAction<any>) {
    if (handlers.hasOwnProperty(action.type)) {
      if (action?.payload?.updates) {
        const updates = action?.payload?.updates;

        for (const update of updates) {
          if (update.kind === "newTree") {
            return update.rhs;
          }
        }
      }

      const fn = handlers[action.type];

      return create(state, (draft) => fn(draft, action));
    } else {
      return state;
    }
  };
};
