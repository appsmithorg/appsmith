import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type {
  AppSettingsPaneContext,
  AppSettingsPaneReduxState,
} from "reducers/uiReducers/appSettingsPaneReducer";
import type { Action } from "redux";

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

export const updateAppSettingsPaneSelectedTabAction = (
  payload: AppSettingsPaneReduxState,
) => {
  return {
    type: ReduxActionTypes.UPDATE_APP_SETTINGS_PANE_SELECTED_TAB,
    payload: payload,
  };
};
