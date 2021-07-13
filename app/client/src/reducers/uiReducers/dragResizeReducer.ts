import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

const initialState: WidgetDragResizeState = {
  isDraggingDisabled: false,
  isDragging: false,
  isResizing: false,
  dragGroupActualParent: "",
  draggingGroupCenter: {},
  newWidget: undefined,
  lastSelectedWidget: undefined,
  selectedWidgets: [],
  focusedWidget: undefined,
  selectedWidgetAncestory: [],
  startPoints: undefined,
  draggedOn: undefined,
};

export const widgetDraggingReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.DISABLE_WIDGET_DRAG]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ isDraggingDisabled: boolean }>,
  ) => {
    state.isDraggingDisabled = action.payload.isDraggingDisabled;
  },
  [ReduxActionTypes.SET_DRAGGING_CANVAS]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{
      draggedOn: string;
    }>,
  ) => {
    state.draggedOn = action.payload.draggedOn;
  },
  [ReduxActionTypes.SET_WIDGET_DRAGGING]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{
      isDragging: boolean;
      dragGroupActualParent: string;
      draggingGroupCenter: DraggingGroupCenter;
      startPoints: any;
    }>,
  ) => {
    state.dragGroupActualParent = action.payload.dragGroupActualParent;
    state.isDragging = action.payload.isDragging;
    state.draggingGroupCenter = action.payload.draggingGroupCenter;
    state.startPoints = action.payload.startPoints;
  },
  [ReduxActionTypes.SET_NEW_WIDGET_DRAGGING]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{
      isDragging: boolean;
      newWidgetProps: any;
    }>,
  ) => {
    state.isDragging = action.payload.isDragging;
    state.newWidget = action.payload.newWidgetProps;
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
    if (action.payload.widgetId === MAIN_CONTAINER_WIDGET_ID) return;
    if (action.payload.isMultiSelect) {
      const widgetId = action.payload.widgetId || "";
      const removeSelection = state.selectedWidgets.includes(widgetId);
      if (removeSelection) {
        state.selectedWidgets = state.selectedWidgets.filter(
          (each) => each !== widgetId,
        );
      } else if (!!widgetId) {
        state.selectedWidgets = [...state.selectedWidgets, widgetId];
      }
      if (state.selectedWidgets.length > 0) {
        state.lastSelectedWidget = removeSelection ? "" : widgetId;
      }
    } else {
      state.lastSelectedWidget = action.payload.widgetId;
      if (action.payload.widgetId) {
        state.selectedWidgets = [action.payload.widgetId];
      } else {
        state.selectedWidgets = [];
      }
    }
  },
  [ReduxActionTypes.DESELECT_WIDGETS]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ widgetIds?: string[] }>,
  ) => {
    const { widgetIds } = action.payload;
    if (widgetIds) {
      state.selectedWidgets = state.selectedWidgets.filter(
        (each) => !widgetIds.includes(each),
      );
    }
  },
  [ReduxActionTypes.SELECT_MULTIPLE_WIDGETS]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ widgetIds?: string[] }>,
  ) => {
    const { widgetIds } = action.payload;
    if (widgetIds) {
      state.selectedWidgets = widgetIds || [];
      if (widgetIds.length > 1) {
        state.lastSelectedWidget = "";
      } else {
        state.lastSelectedWidget = widgetIds[0];
      }
    }
  },
  [ReduxActionTypes.SELECT_WIDGETS]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ widgetIds?: string[] }>,
  ) => {
    const { widgetIds } = action.payload;
    if (widgetIds) {
      state.selectedWidgets = [...state.selectedWidgets, ...widgetIds];
    }
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

type DraggingGroupCenter = {
  widgetId?: string;
  top?: number;
  left?: number;
};

export type WidgetDragResizeState = {
  isDraggingDisabled: boolean;
  isDragging: boolean;
  dragGroupActualParent: string;
  draggingGroupCenter: DraggingGroupCenter;
  isResizing: boolean;
  lastSelectedWidget?: string;
  focusedWidget?: string;
  selectedWidgetAncestory: string[];
  selectedWidgets: string[];
  newWidget: any;
  startPoints: any;
  draggedOn?: string;
};

export default widgetDraggingReducer;
