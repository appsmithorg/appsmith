import { AppSettingsTabs } from "pages/AppIDE/components/AppSettings/AppSettings";
import type { DefaultRootState } from "react-redux";
import type { AppSettingsPaneReduxState } from "reducers/uiReducers/appSettingsPaneReducer";
import { createSelector } from "reselect";

export const getAppSettingsPane = (state: DefaultRootState) =>
  state.ui.appSettingsPane;

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
