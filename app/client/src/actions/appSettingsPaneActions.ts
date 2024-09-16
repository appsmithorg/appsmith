import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { AppSettingsPaneReduxState } from "reducers/uiReducers/appSettingsPaneReducer";

export const updateAppSettingsPaneSelectedTabAction = (
  payload: AppSettingsPaneReduxState,
) => {
  return {
    type: ReduxActionTypes.UPDATE_APP_SETTINGS_PANE_SELECTED_TAB,
    payload: payload,
  };
};
