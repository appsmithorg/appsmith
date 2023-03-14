import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { AppSettingsPaneContext } from "reducers/uiReducers/appSettingsPaneReducer";
import { Action } from "redux";

export const openAppSettingsPaneAction = (context?: AppSettingsPaneContext) => {
  return {
    type: ReduxActionTypes.OPEN_APP_SETTINGS_PANE,
    payload: context,
  };
};

export const closeAppSettingsPaneAction = (): Action => {
  return {
    type: ReduxActionTypes.CLOSE_APP_SETTINGS_PANE,
  };
};
