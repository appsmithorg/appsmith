import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { AppSettingsTabs } from "pages/Editor/AppSettingsPane/AppSettings";
import { createReducer } from "utils/ReducerUtils";

const initialState: AppSettingsPaneReduxState = {
  isOpen: false,
};

const appSettingsPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.OPEN_APP_SETTINGS_PANE]: (
    state: AppSettingsPaneReduxState,
    action: ReduxAction<AppSettingsPaneContext>,
  ): AppSettingsPaneReduxState => {
    return {
      ...state,
      isOpen: true,
      context: action.payload,
    };
  },
  [ReduxActionTypes.CLOSE_APP_SETTINGS_PANE]: (
    state: AppSettingsPaneReduxState,
  ): AppSettingsPaneReduxState => {
    return {
      ...state,
      isOpen: false,
      context: undefined,
    };
  },
});

export interface AppSettingsPaneContext {
  type: AppSettingsTabs;
  pageId?: string;
}

export interface AppSettingsPaneReduxState {
  isOpen: boolean;
  context?: AppSettingsPaneContext;
}

export default appSettingsPaneReducer;
