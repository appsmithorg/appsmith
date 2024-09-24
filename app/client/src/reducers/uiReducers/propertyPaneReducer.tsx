import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { DEFAULT_PROPERTY_PANE_WIDTH } from "constants/AppConstants";
import { createImmerReducer } from "utils/ReducerUtils";
import type { ShowPropertyPanePayload } from "actions/propertyPaneActions";

export interface SelectedPropertyPanel {
  [path: string]: number;
}

const initialState: PropertyPaneReduxState = {
  isVisible: false,
  widgetId: undefined,
  lastWidgetId: undefined,
  isNew: false,
  width: DEFAULT_PROPERTY_PANE_WIDTH,
  selectedPropertyPanel: {},
};

const propertyPaneReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SHOW_PROPERTY_PANE]: (
    state: PropertyPaneReduxState,
    action: ReduxAction<ShowPropertyPanePayload>,
  ) => {
    if (
      action.payload.widgetId &&
      state.lastWidgetId === action.payload.widgetId &&
      !action.payload.force
    ) {
      return;
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

    state.widgetId = widgetId;
    state.isVisible = isVisible;
    state.isVisibleBeforeAction = isVisibleBeforeAction;
  },
  [ReduxActionTypes.HIDE_PROPERTY_PANE]: (state: PropertyPaneReduxState) => {
    state.lastWidgetId = state.widgetId;
    state.isVisible = false;
    state.isVisibleBeforeAction = undefined;
  },
  [ReduxActionTypes.TOGGLE_PROPERTY_PANE_WIDGET_NAME_EDIT]: (
    state: PropertyPaneReduxState,
    action: ReduxAction<{ enable: boolean; widgetId: string }>,
  ) => {
    if (action.payload.widgetId === state.widgetId)
      state.isNew = action.payload.enable;
  },
  [ReduxActionTypes.SET_PROPERTY_PANE_WIDTH]: (
    state: PropertyPaneReduxState,
    action: ReduxAction<number>,
  ) => {
    state.width = action.payload;
  },
  [ReduxActionTypes.SET_FOCUSABLE_PROPERTY_FIELD]: (
    state: PropertyPaneReduxState,
    action: ReduxAction<{ path: string }>,
  ) => {
    state.focusedProperty = action.payload.path;
  },
  [ReduxActionTypes.SET_SELECTED_PANEL_PROPERTY]: (
    state: PropertyPaneReduxState,
    action: {
      payload: { path: string; index: number };
    },
  ) => {
    const { index, path } = action.payload;

    if (path) {
      state.selectedPropertyPanel[path] = index;
    }
  },
  [ReduxActionTypes.UNSET_SELECTED_PANEL_PROPERTY]: (
    state: PropertyPaneReduxState,
    action: {
      payload: string | undefined;
    },
  ) => {
    if (action.payload && action.payload in state.selectedPropertyPanel)
      delete state.selectedPropertyPanel[action.payload];
  },
  [ReduxActionTypes.SET_SELECTED_PANELS]: (
    state: PropertyPaneReduxState,
    action: {
      payload: SelectedPropertyPanel;
    },
  ) => {
    state.selectedPropertyPanel = action.payload;
  },
});

export interface PropertyPaneReduxState {
  widgetId?: string;
  isVisible: boolean;
  lastWidgetId?: string;
  isVisibleBeforeAction?: boolean;
  isNew: boolean;
  selectedPropertyPanel: SelectedPropertyPanel;
  propertyControlId?: string;
  widgetChildProperty?: string;
  width: number;
  focusedProperty?: string;
}

export default propertyPaneReducer;
