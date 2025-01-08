import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";
import type { WidgetQueryGenerationFormConfig } from "WidgetQueryGenerators/types";

const initialState: OneClickBindingState = {
  isConnecting: false,
  config: null,
  showOptions: false,
};

import type { OneClickBindingState } from "./oneClickBindingReducer.types";

const oneClickBindingReducer = createReducer(initialState, {
  [ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE]: (
    state: OneClickBindingState,
    action: ReduxAction<WidgetQueryGenerationFormConfig>,
  ) => {
    return {
      ...state,
      isConnecting: true,
      config: action.payload,
    };
  },
  [ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE_SUCCESS]: (
    state: OneClickBindingState,
  ) => {
    return {
      ...state,
      isConnecting: false,
      config: null,
    };
  },
  [ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE_ERROR]: (
    state: OneClickBindingState,
  ) => {
    return {
      ...state,
      isConnecting: false,
      config: null,
    };
  },
  [ReduxActionTypes.SET_ONE_CLICK_BINDING_OPTIONS_VISIBILITY]: (
    state: OneClickBindingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      showOptions: action.payload,
    };
  },
});

export default oneClickBindingReducer;
