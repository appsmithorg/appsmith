import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";
import type { WidgetQueryGenerationFormConfig } from "WidgetQueryGenerators/types";

const initialState: OneClickBindingState = {
  isConnecting: false,
  config: null,
  showOptions: false,
  selectedColumns: [],
};

export interface OneClickBindingState {
  isConnecting: boolean;
  config: WidgetQueryGenerationFormConfig | null;
  showOptions: boolean;
  selectedColumns: string[];
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
    };
  },
  [ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE_SUCCESS]: (
    state: OneClickBindingState,
  ) => {
    return {
      ...state,
      isConnecting: false,
      config: null,
      selectedColumns: [],
    };
  },
  [ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE_ERROR]: (
    state: OneClickBindingState,
  ) => {
    return {
      ...state,
      isConnecting: false,
      config: null,
      selectedColumns: [],
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
  [ReduxActionTypes.SET_SELECTED_COLUMNS]: (
    state: OneClickBindingState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      selectedColumns: action.payload,
    };
  },
});

export default oneClickBindingReducer;
