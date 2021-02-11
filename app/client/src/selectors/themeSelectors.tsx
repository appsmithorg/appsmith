import { AppState } from "reducers";
import { dark, light, Theme, theme } from "constants/DefaultTheme";

export enum ThemeMode {
  LIGHT = "LIGHT",
  DARK = "DARK",
}

// Only for usage with ThemeProvider
export const getThemeDetails = (
  state: AppState,
  themeMode: ThemeMode,
): Theme => {
  const colors = themeMode === ThemeMode.LIGHT ? light : dark;
  return { ...theme, colors: { ...theme.colors, ...colors } };
};

// Use to get the current theme of the app set via the theme switcher
export const getCurrentThemeDetails = (state: AppState): Theme =>
  state.ui.theme.theme;

// Use to get the current theme mode of the app set via the theme switcher
export const getCurrentThemeMode = (state: AppState) => state.ui.theme.mode;

export const getAppCardColorPalette = (state: AppState) => {
  return state.ui.theme.theme.colors.appCardColors;
};
