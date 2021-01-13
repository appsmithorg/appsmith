import { createReducer } from "utils/AppsmithUtils";
import { WidgetType } from "constants/WidgetConstants";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";

const initialState: PropertyPaneEnhancementsReduxState = {};

export type PropertyPaneEnhancementsDataState = {
  [widgetId: string]: WidgetType;
};

const propertyPaneEnhancementsReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_PROPERTY_PANE_ENHANCEMENTS]: (
    state: PropertyPaneEnhancementsReduxState,
    action: ReduxAction<PropertyPaneEnhancementsDataState>,
  ) => {
    return { ...state, ...action.payload };
  },
});

export interface PropertyPaneEnhancementsReduxState {
  [widgetId: string]: WidgetType[];
}

export default propertyPaneEnhancementsReducer;
