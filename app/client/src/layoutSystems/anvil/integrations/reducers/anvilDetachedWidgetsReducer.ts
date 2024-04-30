import { createImmerReducer } from "utils/ReducerUtils";
import {
  AnvilReduxActionTypes,
  type AnvilReduxAction,
} from "../actions/actionTypes";

export interface AnvilDetachedWidgetsReduxState {
  currentlyOpenDetachedWidgets: string[];
}
const initialState: AnvilDetachedWidgetsReduxState = {
  currentlyOpenDetachedWidgets: [],
};
const anvilDetachedWidgetsReducer = createImmerReducer(initialState, {
  [AnvilReduxActionTypes.SHOW_DETACHED_WIDGET]: (
    state: AnvilDetachedWidgetsReduxState,
    action: AnvilReduxAction<string>,
  ) => {
    state.currentlyOpenDetachedWidgets.push(action.payload);
  },
  [AnvilReduxActionTypes.HIDE_DETACHED_WIDGET]: (
    state: AnvilDetachedWidgetsReduxState,
    action: AnvilReduxAction<string>,
  ) => {
    state.currentlyOpenDetachedWidgets =
      state.currentlyOpenDetachedWidgets.filter(
        (widgetId) => widgetId !== action.payload,
      );
  },
  [AnvilReduxActionTypes.RESET_DETACHED_WIDGETS]: (
    state: AnvilDetachedWidgetsReduxState,
  ) => {
    state.currentlyOpenDetachedWidgets = [];
  },
});

export default anvilDetachedWidgetsReducer;
