import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { WidgetType } from "constants/WidgetConstants";

const initialState: PropertyPaneEnhancementsReduxState = {};

const propertyPaneEnhancementsReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_PROPERTY_PANE_ENHANCEMENTS]: (
    state: PropertyPaneEnhancementsReduxState,
    action: { widgetId },
  ) => {
    return { ...state, defaultRefinement: action.payload };
  },
});

export interface PropertyPaneEnhancementsReduxState {
  [widgetId: string]: WidgetType;
}

export default propertyPaneEnhancementsReducer;
