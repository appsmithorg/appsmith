import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { createImmerReducer } from "utils/ReducerUtils";

const initialState: WidgetDragResizeState = {
  isDraggingDisabled: false,
  isDragging: false,
  dragDetails: {},
  autoLayoutDragDetails: {},
  isResizing: false,
  lastSelectedWidget: undefined,
  selectedWidgets: [],
  focusedWidget: undefined,
  selectedWidgetAncestry: [],
  isAutoCanvasResizing: false,
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
    state.dragDetails.draggedOn = action.payload.draggedOn;
  },
  [ReduxActionTypes.SET_WIDGET_DRAGGING]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{
      isDragging: boolean;
      dragGroupActualParent: string;
      draggingGroupCenter: DraggingGroupCenter;
      startPoints: any;
      draggedOn?: string;
    }>,
  ) => {
    state.isDragging = action.payload.isDragging;
    state.dragDetails = {
      dragGroupActualParent: action.payload.dragGroupActualParent,
      draggingGroupCenter: action.payload.draggingGroupCenter,
      dragOffset: action.payload.startPoints,
    };
    if (action.payload.draggedOn) {
      state.dragDetails.draggedOn = action.payload.draggedOn;
    }
  },
  [ReduxActionTypes.SET_NEW_WIDGET_DRAGGING]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{
      isDragging: boolean;
      newWidgetProps: any;
    }>,
  ) => {
    state.isDragging = action.payload.isDragging;
    state.dragDetails = {
      newWidget: action.payload.newWidgetProps,
      draggedOn: MAIN_CONTAINER_WIDGET_ID,
    };
  },
  [ReduxActionTypes.SET_WIDGET_RESIZING]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ isResizing: boolean }>,
  ) => {
    state.isResizing = action.payload.isResizing;
  },
  [ReduxActionTypes.SET_AUTO_CANVAS_RESIZING]: (
    state: WidgetDragResizeState,
    action: ReduxAction<boolean>,
  ) => {
    state.isAutoCanvasResizing = action.payload;
  },
  [ReduxActionTypes.SET_SELECTED_WIDGETS]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ widgetIds: string[] }>,
  ) => {
    state.selectedWidgets = action.payload.widgetIds;
  },
  [ReduxActionTypes.SET_LAST_SELECTED_WIDGET]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ lastSelectedWidget: string }>,
  ) => {
    state.lastSelectedWidget = action.payload.lastSelectedWidget;
  },
  [ReduxActionTypes.FOCUS_WIDGET]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ widgetId?: string }>,
  ) => {
    state.focusedWidget = action.payload.widgetId;
  },
  [ReduxActionTypes.SET_SELECTED_WIDGET_ANCESTRY]: (
    state: WidgetDragResizeState,
    action: ReduxAction<string[]>,
  ) => {
    state.selectedWidgetAncestry = action.payload;
  },
});

type DraggingGroupCenter = {
  widgetId?: string;
  top?: number;
  left?: number;
};
export type DragDetails = {
  dragGroupActualParent?: string;
  draggingGroupCenter?: DraggingGroupCenter;
  newWidget?: any;
  draggedOn?: string;
  dragOffset?: any;
};

export type WidgetDragResizeState = {
  isDraggingDisabled: boolean;
  isDragging: boolean;
  dragDetails: DragDetails;
  autoLayoutDragDetails: any;
  isResizing: boolean;
  lastSelectedWidget?: string;
  focusedWidget?: string;
  selectedWidgetAncestry: string[];
  selectedWidgets: string[];
  isAutoCanvasResizing: boolean;
};

export default widgetDraggingReducer;
