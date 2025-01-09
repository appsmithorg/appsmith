import type { ReduxAction } from "../../actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { AppSettingsTabs } from "pages/Editor/AppSettingsPane/AppSettings";
import { createReducer } from "utils/ReducerUtils";

const initialState: AppSettingsPaneReduxState = {
  isOpen: false,
  context: {
    type: AppSettingsTabs.General,
  },
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
  [ReduxActionTypes.UPDATE_APP_SETTINGS_PANE_SELECTED_TAB]: (
    state: AppSettingsPaneReduxState,
    action: ReduxAction<AppSettingsPaneReduxState>,
  ): AppSettingsPaneReduxState => {
    return {
      ...state,
      isOpen: action.payload.isOpen,
      context: action.payload.context,
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
