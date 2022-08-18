import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { createReducer } from "utils/ReducerUtils";

const initialState: AppSettingsPaneReduxState = {
  isOpen: false,
};

const appSettingsPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.OPEN_APP_SETTINGS_PANE]: (
    state: AppSettingsPaneReduxState,
  ) => {
    return {
      ...state,
      isOpen: true,
    };
  },
  [ReduxActionTypes.CLOSE_APP_SETTINGS_PANE]: (
    state: AppSettingsPaneReduxState,
  ) => {
    return {
      ...state,
      isOpen: false,
    };
  },
});

export interface AppSettingsPaneReduxState {
  isOpen: boolean;
}

export default appSettingsPaneReducer;
