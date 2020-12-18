import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: WidgetDragResizeState = {
  isDraggingDisabled: false,
  isDragging: false,
  isResizing: false,
  selectedWidget: undefined,
  focusedWidget: undefined,
  selectedWidgetAncestory: [],
  shouldResetSelectedWidget: true,
};

export const widgetDraggingReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.DISABLE_WIDGET_DRAG]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ isDraggingDisabled: boolean }>,
  ) => {
    state.isDraggingDisabled = action.payload.isDraggingDisabled;
  },
  [ReduxActionTypes.SET_WIDGET_DRAGGING]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ isDragging: boolean }>,
  ) => {
    state.isDragging = action.payload.isDragging;
  },
  [ReduxActionTypes.SET_WIDGET_RESIZING]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ isResizing: boolean }>,
  ) => {
    state.isResizing = action.payload.isResizing;
  },
  [ReduxActionTypes.SELECT_WIDGET]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ widgetId?: string }>,
  ) => {
    state.selectedWidget = action.payload.widgetId;
  },
  [ReduxActionTypes.FOCUS_WIDGET]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ widgetId?: string }>,
  ) => {
    state.focusedWidget = action.payload.widgetId;
  },
  [ReduxActionTypes.SET_SELECTED_WIDGET_ANCESTORY]: (
    state: WidgetDragResizeState,
    action: ReduxAction<string[]>,
  ) => {
    state.selectedWidgetAncestory = action.payload;
  },
  [ReduxActionTypes.SET_SHOULD_RESET_WIDGET]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ shouldReset: boolean }>,
  ) => {
    state.shouldResetSelectedWidget = action.payload.shouldReset;
  },
});

export type WidgetDragResizeState = {
  isDraggingDisabled: boolean;
  isDragging: boolean;
  isResizing: boolean;
  selectedWidget?: string;
  focusedWidget?: string;
  selectedWidgetAncestory: string[];
  shouldResetSelectedWidget: boolean;
};

export default widgetDraggingReducer;
