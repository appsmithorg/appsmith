import { AppState } from "reducers";

export enum AppThemingMode {
  APP_THEME_EDIT = "APP_THEME_EDIT",
  APP_THEME_SELECTION = "APP_THEME_SELECTION",
}

/**
 * returns the theming mode ( edit, selection, variant editor )
 *
 * @param state
 * @returns
 */
export const getAppThemingStack = (state: AppState) => {
  return state.ui.appTheming.stack;
};

/**
 * gets the themes
 *
 * @param state
 * @returns
 */
export const getAppThemes = (state: AppState) => {
  return state.ui.appTheming.themes;
};

/**
 * get the selected theme
 *
 * @param state
 * @returns
 */
export const getSelectedAppTheme = (state: AppState) => {
  return state.ui.appTheming.selectedTheme;
};

/**
 * get the selected theme stylsheet
 *
 * @param state
 * @returns
 */
export const getSelectedAppThemeStylesheet = (state: AppState) => {
  return state.ui.appTheming.selectedTheme.stylesheet;
};

/**
 * get the preview theme or selected theme
 *
 * @param state
 * @returns
 */
export const getSelectedAppThemeProperties = (state: AppState) => {
  return state.ui.appTheming.selectedTheme.properties;
};

/**
 * gets the value of `state.ui.appTheming.isSaving`
 *
 * @param state
 * @returns
 */
export const getAppThemeIsChanging = (state: AppState) => {
  return state.ui.appTheming.isChanging;
};

/**
 * gets the value of `state.ui.appTheming.isSaving`
 *
 * @param state
 * @returns
 */
export const getIsBetaCardShown = (state: AppState): boolean =>
  state.ui.appTheming.isBetaCardShown;
