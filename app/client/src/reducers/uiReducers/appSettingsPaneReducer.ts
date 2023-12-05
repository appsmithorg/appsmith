import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { AppSettingsTabs } from "pages/Editor/AppSettingsPane/AppSettings";
import { createReducer } from "utils/ReducerUtils";

const initialState: AppSettingsPaneReduxState = {
  context: {
    type: AppSettingsTabs.General,
  },
};

const appSettingsPaneReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_APP_SETTINGS_PANE_SELECTED_TAB]: (
    state: AppSettingsPaneReduxState,
    action: ReduxAction<AppSettingsPaneReduxState>,
  ): AppSettingsPaneReduxState => {
    return {
      ...state,
      context: action.payload.context,
    };
  },
});

export interface AppSettingsPaneContext {
  type: AppSettingsTabs;
  pageId?: string;
}

export interface AppSettingsPaneReduxState {
  context?: AppSettingsPaneContext;
}

export default appSettingsPaneReducer;
