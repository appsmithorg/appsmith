import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";
import type { WidgetQueryGenerationFormConfig } from "WidgetQueryGenerators/types";

const initialState: OneClickBindingState = {
  isConnecting: false,
  config: null,
  showOptions: false,
  inProgress: false,
};

export interface OneClickBindingState {
  isConnecting: boolean;
  config: WidgetQueryGenerationFormConfig | null;
  showOptions: boolean;
  inProgress: boolean;
}

const oneClickBindingReducer = createReducer(initialState, {
  [ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE]: (
    state: OneClickBindingState,
    action: ReduxAction<WidgetQueryGenerationFormConfig>,
  ) => {
    return {
      ...state,
      isConnecting: true,
      config: action.payload,
      inProgress: false,
    };
  },
  [ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE_SUCCESS]: (
    state: OneClickBindingState,
  ) => {
    return {
      ...state,
      isConnecting: false,
      config: null,
      inProgress: false,
    };
  },
  [ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE_ERROR]: (
    state: OneClickBindingState,
  ) => {
    return {
      ...state,
      isConnecting: false,
      config: null,
      inProgress: false,
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
  [ReduxActionTypes.SET_ONE_CLICK_BINDING_PROGRESS]: (
    state: OneClickBindingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      inProgress: action.payload,
    };
  },
  [ReduxActionTypes.FOCUS_WIDGET]: (state: OneClickBindingState) => {
    return {
      ...state,
      inProgress: false,
    };
  },
  [ReduxActionTypes.SET_WIDGET_DYNAMIC_PROPERTY]: (
    state: OneClickBindingState,
  ) => {
    return {
      ...state,
      inProgress: false,
    };
  },
});

export default oneClickBindingReducer;
