import { AppState } from "ce/reducers";

export const getIsAppSettingsPaneOpen = (state: AppState) =>
  state.ui.appSettingsPane.isOpen;
