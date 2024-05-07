import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { createImmerReducer } from "utils/ReducerUtils";
import type { SetSelectedWidgetsPayload } from "../../actions/widgetSelectionActions";
import { AnvilReduxActionTypes } from "layoutSystems/anvil/integrations/actions/actionTypes";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";

const initialState: WidgetDragResizeState = {
  isDragging: false,
  dragDetails: {},
  autoLayoutDragDetails: {},
  isResizing: false,
  lastSelectedWidget: undefined,
  selectedWidgets: [],
  focusedWidget: undefined,
  selectedWidgetAncestry: [],
  entityExplorerAncestry: [],
  isAutoCanvasResizing: false,
  anvil: {
    highlightShown: undefined,
    isDistributingSpace: false,
  },
  isDraggingDisabled: false,
  blockSelection: false,
  altFocus: false,
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
    if (state.dragDetails.draggedOn !== action.payload.draggedOn) {
      state.dragDetails.draggedOn = action.payload.draggedOn;
    }
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
    action: ReduxAction<SetSelectedWidgetsPayload>,
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
    action: ReduxAction<{ widgetId?: string; alt?: boolean }>,
  ) => {
    if (state.focusedWidget !== action.payload.widgetId) {
      state.focusedWidget = action.payload.widgetId;
    }
    if (state.altFocus !== action.payload.alt) {
      state.altFocus = !!action.payload.alt;
    }
  },
  [ReduxActionTypes.ALT_FOCUS_WIDGET]: (
    state: WidgetDragResizeState,
    action: ReduxAction<boolean>,
  ) => {
    state.altFocus = action.payload;
  },
  [ReduxActionTypes.SET_SELECTED_WIDGET_ANCESTRY]: (
    state: WidgetDragResizeState,
    action: ReduxAction<string[]>,
  ) => {
    state.selectedWidgetAncestry = action.payload;
  },
  [ReduxActionTypes.SET_ENTITY_EXPLORER_WIDGET_ANCESTRY]: (
    state: WidgetDragResizeState,
    action: ReduxAction<string[]>,
  ) => {
    state.entityExplorerAncestry = action.payload;
  },
  [ReduxActionTypes.SET_WIDGET_SELECTION_BLOCK]: (
    state: WidgetDragResizeState,
    action: ReduxAction<boolean>,
  ) => {
    state.blockSelection = action.payload;
  },
  //space distribution redux
  [AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_START]: (
    state: WidgetDragResizeState,
  ) => {
    state.anvil.isDistributingSpace = true;
  },
  [AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_STOP]: (
    state: WidgetDragResizeState,
  ) => {
    state.anvil.isDistributingSpace = false;
  },
  [AnvilReduxActionTypes.ANVIL_SET_HIGHLIGHT_SHOWN]: (
    state: WidgetDragResizeState,
    action: ReduxAction<{ highlight?: AnvilHighlightInfo }>,
  ) => {
    state.anvil.highlightShown = action.payload.highlight;
  },
});

export interface DraggingGroupCenter {
  widgetId?: string;
  widgetType?: string;
  top?: number;
  left?: number;
}
export interface DragDetails {
  dragGroupActualParent?: string;
  draggingGroupCenter?: DraggingGroupCenter;
  newWidget?: any;
  draggedOn?: string;
  dragOffset?: any;
}

export interface WidgetDragResizeState {
  isDragging: boolean;
  dragDetails: DragDetails;
  autoLayoutDragDetails: any;
  isResizing: boolean;
  anvil: {
    highlightShown?: AnvilHighlightInfo;
    isDistributingSpace: boolean;
  };
  lastSelectedWidget?: string;
  focusedWidget?: string;
  selectedWidgetAncestry: string[];
  entityExplorerAncestry: string[];
  selectedWidgets: string[];
  isAutoCanvasResizing: boolean;
  isDraggingDisabled: boolean;
  blockSelection: boolean;
  altFocus: boolean;
}

export default widgetDraggingReducer;
