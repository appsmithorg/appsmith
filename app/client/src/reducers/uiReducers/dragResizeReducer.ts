import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: WidgetDragResizeState = {
  isDraggingDisabled: false,
  isDragging: false,
  isResizing: false,
};

export const widgetDraggingReducer = createReducer(initialState, {
  [ReduxActionTypes.DISABLE_WIDGET_DRAG]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ disable: boolean }>,
  ) => {
    return { ...state, ...action.payload };
  },
  [ReduxActionTypes.SET_WIDGET_DRAGGING]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ isDragging: boolean }>,
  ) => {
    return { ...state, ...action.payload };
  },
  [ReduxActionTypes.SET_WIDGET_RESIZING]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ isResizing: boolean }>,
  ) => {
    return { ...state, ...action.payload };
  },
});

export type WidgetDragResizeState = {
  isDraggingDisabled: boolean;
  isDragging: boolean;
  isResizing: boolean;
};

export default widgetDraggingReducer;
