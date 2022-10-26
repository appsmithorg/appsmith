import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { AppSettingsTabs } from "pages/Editor/AppSettingsPane/AppSettings";
import { createReducer } from "utils/ReducerUtils";

const initialState: AppSettingsPaneReduxState = {
  isOpen: false,
  reopenExplorerOnClose: false,
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
  [ReduxActionTypes.REOPEN_EXPLORER_ON_SETTINGS_PANE_CLOSE]: (
    state: AppSettingsPaneReduxState,
    action: ReduxAction<boolean>,
  ): AppSettingsPaneReduxState => {
    return {
      ...state,
      reopenExplorerOnClose: action.payload,
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
  reopenExplorerOnClose: boolean;
}

export default appSettingsPaneReducer;
