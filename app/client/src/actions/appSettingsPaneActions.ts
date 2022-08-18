import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export const openAppSettingsPaneAction = () => {
  return {
    type: ReduxActionTypes.OPEN_APP_SETTINGS_PANE,
  };
};

export const closeAppSettingsPaneAction = () => {
  return {
    type: ReduxActionTypes.CLOSE_APP_SETTINGS_PANE,
  };
};
