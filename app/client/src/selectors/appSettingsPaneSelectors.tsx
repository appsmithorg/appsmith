import type { AppState } from "@appsmith/reducers";
import type { AppSettingsPaneReduxState } from "reducers/uiReducers/appSettingsPaneReducer";
import { createSelector } from "reselect";

export const getAppSettingsPane = (state: AppState) => state.ui.appSettingsPane;

export const getIsAppSettingsPaneOpen = createSelector(
  getAppSettingsPane,
  (appSettingsPane: AppSettingsPaneReduxState) => appSettingsPane.isOpen,
);
