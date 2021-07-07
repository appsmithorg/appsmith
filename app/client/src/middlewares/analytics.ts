import { Middleware, Dispatch, Action, MiddlewareAPI } from "redux";

import { AppState } from "reducers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

/**
 * this middleware intercepts each action and fire analytics
 * @param store
 * @returns
 */
export const analyticsMiddleware: Middleware = ({
  getState,
}: MiddlewareAPI) => (next: Dispatch) => (action) => {
  track(action, getState());

  return next(action);
};

/**
 * logs events with analytics lib
 *
 * @param action
 */
function track(action: Action, store: AppState): void {
  switch (action.type) {
    case ReduxActionTypes.PASTE_COPIED_WIDGET_INIT:
      // TODO: add analytics logic here
      break;
  }
}
