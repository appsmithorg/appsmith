import { AppState } from "ce/reducers";

export const getAppSettingsPane = (state: AppState) => state.ui.appSettingsPane;

export const getIsAppSettingsPaneOpen = (state: AppState) =>
  state.ui.appSettingsPane.isOpen;
