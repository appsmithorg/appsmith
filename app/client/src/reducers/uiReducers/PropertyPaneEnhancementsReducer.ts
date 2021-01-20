import { createReducer } from "utils/AppsmithUtils";
import { WidgetType } from "constants/WidgetConstants";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";

const initialState: PropertyPaneEnhancementsReduxState = {};

export type PropertyPaneEnhancementsDataState = {
  [widgetId: string]: {
    parentId?: string;
    type: WidgetType;
    parentWidgetName?: string;
  };
};

const propertyPaneEnhancementsReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_PROPERTY_PANE_ENHANCEMENTS]: (
    state: PropertyPaneEnhancementsReduxState,
    action: ReduxAction<PropertyPaneEnhancementsDataState>,
  ) => {
    return { ...state, ...action.payload };
  },
});

export type PropertyPaneEnhancementsReduxState = {
  [widgetId: string]: {
    parentId?: string;
    type: WidgetType;
  };
};

export default propertyPaneEnhancementsReducer;
