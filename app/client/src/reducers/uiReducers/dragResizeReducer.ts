import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: WidgetDragResizeState = {
  isDraggingDisabled: false,
  isDragging: false,
  isResizing: false,
  selectedWidget: undefined,
  focusedWidget: undefined,
};

export const widgetDraggingReducer = createReducer(initialState, {
  [ReduxActionTypes.DISABLE_WIDGET_DRAG]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ isDraggingDisabled: boolean }>,
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
  [ReduxActionTypes.SELECT_WIDGET]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ widgetId?: string }>,
  ) => {
    return { ...state, selectedWidget: action.payload.widgetId };
  },
  [ReduxActionTypes.FOCUS_WIDGET]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ widgetId?: string }>,
  ) => {
    return { ...state, focusedWidget: action.payload.widgetId };
  },
});

export type WidgetDragResizeState = {
  isDraggingDisabled: boolean;
  isDragging: boolean;
  isResizing: boolean;
  selectedWidget?: string;
  focusedWidget?: string;
};

export default widgetDraggingReducer;
