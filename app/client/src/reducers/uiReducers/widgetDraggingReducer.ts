import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetDraggingState } from "actions/widgetActions";

const initialState: WidgetDraggingState = {
  disable: false,
};

export const widgetDraggingReducer = createReducer(initialState, {
  [ReduxActionTypes.DISABLE_WIDGET_DRAG]: (
    state: WidgetDraggingState,
    action: ReduxAction<WidgetDraggingState>,
  ) => {
    return { ...state, ...action.payload };
  },
});
