import { AppSettingsTabs } from "pages/Editor/AppSettingsPane/AppSettings";
import type { AppState } from "@appsmith/reducers";
import type { AppSettingsPaneReduxState } from "reducers/uiReducers/appSettingsPaneReducer";
import { createSelector } from "reselect";
import { getIsAppSidebarEnabled } from "./ideSelectors";

export const getAppSettingsPane = (state: AppState) => state.ui.appSettingsPane;

export const getIsAppSettingsPaneOpen = createSelector(
  getAppSettingsPane,
  getIsAppSidebarEnabled,
  (
    appSettingsPane: AppSettingsPaneReduxState,
    isAppSidebarEnabled: boolean,
  ) => {
    // When sidebar is enabled we depend only on the url
    if (isAppSidebarEnabled) return false;
    return appSettingsPane.isOpen;
  },
);

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
