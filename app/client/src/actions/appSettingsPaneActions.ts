import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { Action } from "redux";

export const openAppSettingsPaneAction = (): Action => {
  return {
    type: ReduxActionTypes.OPEN_APP_SETTINGS_PANE,
  };
};

export const closeAppSettingsPaneAction = (): Action => {
  return {
    type: ReduxActionTypes.CLOSE_APP_SETTINGS_PANE,
  };
};
