import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ShowPropertyPanePayload,
} from "constants/ReduxActionConstants";

const initialState: PropertyPaneReduxState = {
  isVisible: false,
  widgetId: undefined,
  node: undefined,
};

const propertyPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.SHOW_PROPERTY_PANE]: (
    state: PropertyPaneReduxState,
    action: ReduxAction<ShowPropertyPanePayload>,
  ) => {
    let isVisible = true;
    const { widgetId, node, toggle } = action.payload;
    if (state.widgetId === action.payload.widgetId) {
      isVisible = state.isVisible;
    }
    if (toggle) {
      isVisible = !state.isVisible;
    }
    return { ...state, widgetId, node, isVisible };
  },
  [ReduxActionTypes.HIDE_PROPERTY_PANE]: (state: PropertyPaneReduxState) => {
    return { ...state, isVisible: false };
  },
});

export interface PropertyPaneReduxState {
  widgetId?: string;
  isVisible: boolean;
  node?: HTMLDivElement;
}

export default propertyPaneReducer;
