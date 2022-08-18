import { AppState } from "reducers";

export const getIsAppSettingsPaneOpen = (state: AppState) =>
  state.ui.appSettingsPane.isOpen;
