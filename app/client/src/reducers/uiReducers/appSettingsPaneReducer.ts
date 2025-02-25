import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { AppSettingsTabs } from "pages/AppIDE/components/AppSettings/AppSettings";
import { createReducer } from "utils/ReducerUtils";

const initialState: AppSettingsPaneReduxState = {
  isOpen: false,
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
