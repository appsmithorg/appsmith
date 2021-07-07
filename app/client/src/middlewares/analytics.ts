import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { AppState } from "reducers";
import { Middleware, AnyAction } from "redux";

/**
 * this middleware intercepts each action and fire analytics
 * @param store
 * @returns
 */
export const analyticsMiddleware: Middleware<{}, AppState> = () => (next) => (
  action,
) => {
  track(action);
  return next(action);
};

/**
 * logs events with analytics lib
 *
 * @param action
 */
function track(action: AnyAction): void {
  switch (action.type) {
    case ReduxActionTypes.PASTE_COPIED_WIDGET_INIT:
      console.log("logging from middleware");
      break;
  }
}
