import { AppThemingMode } from "selectors/appThemingSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

export type FetchAppThemesAction = {
  applicationId: string;
};

export type FetchSelectedAppThemeAction = {
  applicationId: string;
};

/**
 * set theming mode
 *
 * @param mode
 * @returns
 */
export const setAppThemingMode = (mode: AppThemingMode) => ({
  type: ReduxActionTypes.SET_APP_THEMING_MODE,
  payload: mode,
});

/**
 * fetches themes
 *
 * @param mode
 * @returns
 */
export const fetchAppThemes = (applicationId: string) => ({
  type: ReduxActionTypes.FETCH_APP_THEMES_INIT,
  payload: {
    applicationId,
  },
});

/**
 * fetch selected theme
 *
 * @param mode
 * @returns
 */
export const fetchSelectedAppTheme = (applicationId: string) => ({
  type: ReduxActionTypes.FETCH_SELECTED_APP_THEME_INIT,
  payload: {
    applicationId,
  },
});

/**
 * update selected theme
 *
 * @param mode
 * @returns
 */
export const updateSelectedTheme = (applicationId: string) => ({
  type: ReduxActionTypes.FETCH_SELECTED_APP_THEME_INIT,
  payload: {
    applicationId,
  },
});
