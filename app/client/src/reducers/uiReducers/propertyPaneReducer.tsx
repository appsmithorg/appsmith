import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ShowPropertyPanePayload,
} from "constants/ReduxActionConstants";

const initialState: PropertyPaneReduxState = {
  isVisible: false,
  widgetId: undefined,
};

const propertyPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.SHOW_PROPERTY_PANE]: (
    state: PropertyPaneReduxState,
    action: ReduxAction<ShowPropertyPanePayload>,
  ) => {
    const { widgetId, toggle } = action.payload;
    // If toggle is true, an action has started or ended.
    // If the action has started, isVisibleBeforeAction should be undefined
    // If the action has ended, isVisibleBeforeAction should be the visible state
    // of the property pane to use.
    let isVisibleBeforeAction = undefined;
    if (toggle && state.isVisibleBeforeAction === undefined) {
      isVisibleBeforeAction = state.isVisible;
    }

    // If toggle is true, an action has started or ended
    // If isVisibleBeforeAction is undefined, show property pane
    // If isVisibleBeforeAction is defined, set visibility to its value
    let isVisible = true;
    if (toggle && state.isVisibleBeforeAction === undefined) {
      isVisible = false;
    } else if (toggle && state.isVisibleBeforeAction !== undefined) {
      isVisible = state.isVisibleBeforeAction;
    } else {
      isVisible = true;
    }

    return { ...state, widgetId, isVisible, isVisibleBeforeAction };
  },
  [ReduxActionTypes.HIDE_PROPERTY_PANE]: (state: PropertyPaneReduxState) => {
    return { ...state, isVisible: false, isVisibleBeforeAction: undefined };
  },
});

export interface PropertyPaneReduxState {
  widgetId?: string;
  isVisible: boolean;
  isVisibleBeforeAction?: boolean;
}

export default propertyPaneReducer;
