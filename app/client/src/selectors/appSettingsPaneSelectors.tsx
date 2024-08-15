import { AppSettingsTabs } from "pages/Editor/AppSettingsPane/AppSettings";
import type { AppState } from "ee/reducers";
import type { AppSettingsPaneReduxState } from "reducers/uiReducers/appSettingsPaneReducer";
import { createSelector } from "reselect";

export const getAppSettingsPane = (state: AppState) => state.ui.appSettingsPane;

export const getAppSettingsPaneContext = createSelector(
  getAppSettingsPane,
  (appSettingsPane: AppSettingsPaneReduxState) => appSettingsPane.context,
);

export const getIsAppSettingsPaneWithNavigationTabOpen = createSelector(
  getAppSettingsPane,
  (appSettingsPane: AppSettingsPaneReduxState) => {
    if (appSettingsPane.context?.type) {
      return AppSettingsTabs.Navigation === appSettingsPane.context.type;
    }

    return false;
  },
);
