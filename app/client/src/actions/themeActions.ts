import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ThemeMode } from "../selectors/themeSelectors";

export const setThemeMode = (mode: ThemeMode) => ({
  type: ReduxActionTypes.SET_THEME,
  payload: mode,
});
