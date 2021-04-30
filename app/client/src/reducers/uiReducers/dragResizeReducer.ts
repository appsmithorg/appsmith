import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

export const SINGLE_SELECT: "SINGLE_SELECT" = "SINGLE_SELECT" as const;
export const MULTI_SELECT: "MULTI_SELECT" = "MULTI_SELECT" as const;

export type SELECTION_MODES = typeof SINGLE_SELECT | typeof MULTI_SELECT;

const initialState: WidgetDragResizeState = {
  isDraggingDisabled: false,
  isDragging: false,
  isResizing: false,
  selectedWidget: undefined,
  selectedWidgets: [],
  focusedWidget: undefined,
  selectedWidgetAncestory: [],
  selectionMode: SINGLE_SELECT,
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
    action: ReduxAction<{ widgetId?: string; isMultiSelect?: boolean }>,
  ) => {
    if (action.payload.widgetId === MAIN_CONTAINER_WIDGET_ID) {
      state.selectedWidgets = [];
      state.selectedWidget = "";
      return;
    }
    if (action.payload.isMultiSelect) {
      state.selectedWidget = "";
      const widgetId = action.payload.widgetId || "";
      const removeSelection = state.selectedWidgets.includes(widgetId);
      if (removeSelection) {
        state.selectedWidgets = state.selectedWidgets.filter(
          (each) => each !== widgetId,
        );
      } else if (!!widgetId) {
        state.selectedWidgets = [...state.selectedWidgets, widgetId];
      }
    } else {
      state.selectedWidget = action.payload.widgetId;
      if (action.payload.widgetId) {
        state.selectedWidgets = [action.payload.widgetId];
      } else {
        state.selectedWidgets = [];
      }
    }
  },
  [ReduxActionTypes.MULTI_SELECT]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ start: boolean }>,
  ) => {
    state.selectionMode = action.payload.start ? MULTI_SELECT : SINGLE_SELECT;
  },
  [ReduxActionTypes.SELECT_WIDGETS]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ widgetIds?: string[] }>,
  ) => {
    state.selectedWidgets = action.payload.widgetIds || [];
    state.selectedWidget = "";
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
});

export type WidgetDragResizeState = {
  isDraggingDisabled: boolean;
  isDragging: boolean;
  isResizing: boolean;
  selectedWidget?: string;
  focusedWidget?: string;
  selectedWidgetAncestory: string[];
  selectedWidgets: string[];
  selectionMode: SELECTION_MODES;
};

export default widgetDraggingReducer;
