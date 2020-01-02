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
    const { widgetId } = action.payload;
    return { ...state, widgetId, isVisible: true };
  },
  [ReduxActionTypes.HIDE_PROPERTY_PANE]: (state: PropertyPaneReduxState) => {
    return { ...state, isVisible: false };
  },
});

export interface PropertyPaneReduxState {
  widgetId?: string;
  isVisible: boolean;
}

export default propertyPaneReducer;
