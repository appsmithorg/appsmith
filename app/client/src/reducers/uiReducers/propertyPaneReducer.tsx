import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ShowPropertyPanePayload,
} from "../../constants/ReduxActionConstants";

const initialState: PropertyPaneReduxState = {
  isVisible: false,
};

const propertyPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.SHOW_PROPERTY_PANE]: (
    state: PropertyPaneReduxState,
    action: ReduxAction<ShowPropertyPanePayload>,
  ) => {
    return { widgetId: action.payload };
  },
});

export interface PropertyPaneReduxState {
  widgetId?: string;
  isVisible: boolean;
}

export default propertyPaneReducer;
