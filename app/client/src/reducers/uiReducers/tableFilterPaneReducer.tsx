import { createReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ShowPropertyPanePayload,
} from "@appsmith/constants/ReduxActionConstants";

const initialState: TableFilterPaneReduxState = {
  isVisible: false,
  widgetId: undefined,
  lastWidgetId: undefined,
};

const tableFilterPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.SHOW_TABLE_FILTER_PANE]: (
    state: TableFilterPaneReduxState,
    action: ReduxAction<ShowPropertyPanePayload>,
  ) => {
    if (
      action.payload.widgetId &&
      state.lastWidgetId === action.payload.widgetId &&
      !action.payload.force
    ) {
      return state;
    }
    const { callForDragOrResize, widgetId } = action.payload;
    // If callForDragOrResize is true, an action has started or ended.
    // If the action has started, isVisibleBeforeAction should be undefined
    // If the action has ended, isVisibleBeforeAction should be the visible state
    // of the property pane to use.
    let isVisibleBeforeAction = undefined;
    if (callForDragOrResize && state.isVisibleBeforeAction === undefined) {
      isVisibleBeforeAction = state.isVisible;
    }

    // If callForDragOrResize is true, an action has started or ended
    // If isVisibleBeforeAction is undefined, show property pane
    // If isVisibleBeforeAction is defined, set visibility to its value
    let isVisible = true;
    if (callForDragOrResize && state.isVisibleBeforeAction === undefined) {
      isVisible = false;
    } else if (
      callForDragOrResize &&
      state.isVisibleBeforeAction !== undefined
    ) {
      isVisible = state.isVisibleBeforeAction;
    } else {
      isVisible = true;
    }

    return { ...state, widgetId, isVisible, isVisibleBeforeAction };
  },
  [ReduxActionTypes.HIDE_TABLE_FILTER_PANE]: (
    state: TableFilterPaneReduxState,
  ) => {
    return {
      ...state,
      isVisible: false,
      isVisibleBeforeAction: undefined,
      lastWidgetId: state.widgetId,
    };
  },
});

export interface TableFilterPaneReduxState {
  isVisible: boolean;
  widgetId?: string;
  lastWidgetId?: string;
  isVisibleBeforeAction?: boolean;
}

export default tableFilterPaneReducer;
