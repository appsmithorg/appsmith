import type { DefaultRootState } from "react-redux";
import type { Theme } from "constants/DefaultTheme";
import { dark, light, theme } from "constants/DefaultTheme";

export enum ThemeMode {
  LIGHT = "LIGHT",
  DARK = "DARK",
}

export const lightTheme = { ...theme, colors: { ...theme.colors, ...light } };

const darkTheme = { ...theme, colors: { ...theme.colors, ...dark } };

// Only for usage with ThemeProvider
export const getThemeDetails = (
  state: DefaultRootState,
  themeMode: ThemeMode,
): Theme => (themeMode === ThemeMode.LIGHT ? lightTheme : darkTheme);

export const getTheme = (themeMode: ThemeMode) => {
  const colors = themeMode === ThemeMode.LIGHT ? light : dark;

  return { ...theme, colors: { ...theme.colors, ...colors } };
};

// Use to get the current theme of the app set via the theme switcher
export const getCurrentThemeDetails = (state: DefaultRootState): Theme =>
  state.ui.theme.theme;

// Use to get the current theme mode of the app set via the theme switcher
export const getCurrentThemeMode = (state: DefaultRootState) =>
  state.ui.theme.mode;

export const getAppCardColorPalette = (state: DefaultRootState) => {
  return state.ui.theme.theme.colors.appCardColors;
};
