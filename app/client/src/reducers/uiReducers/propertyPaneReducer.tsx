import _ from "lodash";
import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  ShowPropertyPanePayload,
} from "../../constants/ReduxActionConstants";
import { ERROR_CODES, ErrorCode } from "../../constants/validationErrorCodes";
import { UpdateWidgetPropertyValidation } from "../../actions/controlActions";

const initialState: PropertyPaneReduxState = {
  isVisible: false,
  widgetId: undefined,
  node: undefined,
  errors: {},
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
  [ReduxActionTypes.UPDATE_WIDGET_PROPERTY_VALIDATION]: (
    state: PropertyPaneReduxState,
    action: ReduxAction<UpdateWidgetPropertyValidation>,
  ) => {
    const { widgetId, propertyName, errorCode } = action.payload;
    let widgetErrors = { ...state.errors[widgetId] };
    if (action.payload.errorCode === ERROR_CODES.NO_ERROR) {
      widgetErrors = _.omit(widgetErrors, propertyName);
    } else {
      widgetErrors[propertyName] = errorCode;
    }
    const errors = { ...state.errors, [widgetId]: widgetErrors };
    return { ...state, errors };
  },
});

export interface PropertyPaneReduxState {
  widgetId?: string;
  isVisible: boolean;
  node?: HTMLDivElement;
  errors: Record<string, Record<string, ErrorCode>>;
}

export default propertyPaneReducer;
