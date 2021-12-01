import { AppTheme } from "entities/AppTheming";
import { AppThemingMode } from "selectors/appThemingSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

/**
 * ----------------------------------------------------------------------------
 * ACTION TYPES
 * ----------------------------------------------------------------------------
 */

export type FetchAppThemesAction = {
  applicationId: string;
};

export type FetchSelectedAppThemeAction = {
  applicationId: string;
};

export type UpdateSelectedAppThemeAction = {
  applicationId: string;
  theme: AppTheme;
};

/**
 * ----------------------------------------------------------------------------
 * ACTIONS
 * ----------------------------------------------------------------------------
 */

/**
 * set theming mode
 *
 * @param mode
 * @returns
 */
export const setAppThemingModeAction = (mode: AppThemingMode) => ({
  type: ReduxActionTypes.SET_APP_THEMING_MODE,
  payload: mode,
});

/**
 * fetches themes
 *
 * @param mode
 * @returns
 */
export const fetchAppThemesAction = (applicationId: string) => ({
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
export const fetchSelectedAppThemeAction = (applicationId: string) => ({
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
export const updateSelectedThemeAction = (
  payload: UpdateSelectedAppThemeAction,
) => ({
  type: ReduxActionTypes.UPDATE_SELECTED_APP_THEME_INIT,
  payload,
});
