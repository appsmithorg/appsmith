import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ThemeMode } from "reducers/uiReducers/themeReducer";

export const setThemeMode = (mode: ThemeMode) => ({
  type: ReduxActionTypes.SET_THEME,
  payload: mode,
});
