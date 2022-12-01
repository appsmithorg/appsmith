import { AppTheme } from "entities/AppTheming";
import { AppThemingMode } from "selectors/appThemingSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

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

export type SaveAppThemeAction = {
  applicationId: string;
  name: string;
};

export type DeleteAppThemeAction = {
  themeId: string;
  name: string;
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

/**
 * set the preview theme
 *
 * @param payload
 * @returns
 */
export const saveSelectedThemeAction = (payload?: SaveAppThemeAction) => ({
  type: ReduxActionTypes.SAVE_APP_THEME_INIT,
  payload,
});

/**
 * delete app theme
 *
 * @param payload
 * @returns
 */
export const deleteAppThemeAction = (payload?: DeleteAppThemeAction) => ({
  type: ReduxActionTypes.DELETE_APP_THEME_INIT,
  payload,
});

/**
 * close beta card
 *
 * @returns
 */
export const closeAppThemingBetaCard = () => {
  return {
    type: ReduxActionTypes.CLOSE_BETA_CARD_SHOWN,
  };
};

/**
 * close beta card
 *
 * @returns
 */
export const updateisBetaCardShownAction = (payload: boolean) => {
  return {
    type: ReduxActionTypes.UPDATE_BETA_CARD_SHOWN,
    payload,
  };
};

/**
 * reset theme
 *
 * @returns
 */
export const resetThemeAction = () => {
  return {
    type: ReduxActionTypes.RESET_APP_THEME_INIT,
  };
};
