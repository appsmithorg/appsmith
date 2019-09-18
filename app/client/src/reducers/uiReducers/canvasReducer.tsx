import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  LoadCanvasWidgetsPayload,
  ReduxAction,
} from "../../constants/ReduxActionConstants";

const initialState: CanvasReduxState = {
  pageWidgetId: "0",
};

const canvasReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_CANVAS]: (
    state: CanvasReduxState,
    action: ReduxAction<LoadCanvasWidgetsPayload>,
  ) => {
    return { pageWidgetId: action.payload.pageWidgetId };
  },
});

export interface CanvasReduxState {
  pageWidgetId: string;
}

export default canvasReducer;
