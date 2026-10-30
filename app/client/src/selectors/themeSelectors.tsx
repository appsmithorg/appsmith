import type { DefaultRootState } from "react-redux";
import type { Theme } from "constants/DefaultTheme";
import { dark, light, theme } from "constants/DefaultTheme";

export enum ThemeMode {
  LIGHT = "LIGHT",
  DARK = "DARK",
  SYSTEM = "SYSTEM",
}

export const lightTheme = { ...theme, colors: { ...theme.colors, ...light } };

const darkTheme = { ...theme, colors: { ...theme.colors, ...dark } };

export const getResolvedThemeMode = (
  themeMode: ThemeMode,
): ThemeMode.LIGHT | ThemeMode.DARK => {
  if (themeMode !== ThemeMode.SYSTEM) {
    return themeMode;
  }

  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? ThemeMode.DARK
    : ThemeMode.LIGHT;
};

// Only for usage with ThemeProvider
export const getThemeDetails = (
  state: DefaultRootState,
  themeMode: ThemeMode,
): Theme =>
  getResolvedThemeMode(themeMode) === ThemeMode.LIGHT ? lightTheme : darkTheme;

export const getTheme = (themeMode: ThemeMode) => {
  const colors =
    getResolvedThemeMode(themeMode) === ThemeMode.LIGHT ? light : dark;

  return { ...theme, colors: { ...theme.colors, ...colors } };
};

// Use to get the current theme of the app set via the theme switcher
export const getCurrentThemeDetails = (state: DefaultRootState): Theme =>
  state.ui.theme.theme;

export const getCurrentThemePreference = (state: DefaultRootState) =>
  state.ui.theme.mode;

// Use to get the resolved theme mode for components that need a concrete palette.
export const getCurrentThemeMode = (state: DefaultRootState) =>
  getResolvedThemeMode(state.ui.theme.mode);

export const getAppCardColorPalette = (state: DefaultRootState) => {
  return state.ui.theme.theme.colors.appCardColors;
};
