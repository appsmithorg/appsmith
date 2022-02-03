import { AppTheme } from "entities/AppTheming";
import { AppThemingMode } from "selectors/appThemingSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

/**
 * ----------------------------------------------------------------------------
 * ACTION TYPES
 * ----------------------------------------------------------------------------
 */

export type FetchSelectedAppThemeAction = {
  applicationId: string;
};

export type UpdateSelectedAppThemeAction = {
  applicationId: string;
  theme: AppTheme;
  shouldReplay?: boolean;
};

export type ChangeSelectedAppThemeAction = {
  applicationId: string;
  theme: AppTheme;
  shouldReplay?: boolean;
};

export type HydrateSelectedAppThemeAction = {
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
export const setAppThemingModeStackAction = (stack: AppThemingMode[]) => ({
  type: ReduxActionTypes.SET_APP_THEMING_STACK,
  payload: stack,
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
 * @param payload
 * @returns
 */
export const updateSelectedAppThemeAction = (
  payload: UpdateSelectedAppThemeAction,
) => ({
  type: ReduxActionTypes.UPDATE_SELECTED_APP_THEME_INIT,
  payload,
});

/**
 * change selected theme
 *
 * @param payload
 * @returns
 */
export const changeSelectedAppThemeAction = (
  payload: ChangeSelectedAppThemeAction,
) => ({
  type: ReduxActionTypes.CHANGE_SELECTED_APP_THEME_INIT,
  payload,
});

/**
 * set the preview theme
 *
 * @param payload
 * @returns
 */
export const setPreviewAppThemeAction = (payload?: AppTheme) => ({
  type: ReduxActionTypes.SET_PREVIEW_APP_THEME,
  payload,
});
