import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";
import type { WidgetQueryGenerationFormConfig } from "WidgetQueryGenerators/types";

const initialState: OneClickBindingState = {
  isConnecting: false,
  config: null,
};

export interface OneClickBindingState {
  isConnecting: boolean;
  config: WidgetQueryGenerationFormConfig | null;
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
});

export default oneClickBindingReducer;
