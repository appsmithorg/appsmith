import { AppState } from "reducers";
import {
  AUTH_LOGIN_URL,
  SIGN_UP_URL,
  RESET_PASSWORD_URL,
  FORGOT_PASSWORD_URL,
  VIEWER_URL_REGEX,
} from "constants/routes";
import { theme, dark, light } from "constants/DefaultTheme";

const enforceDarkThemeRoutes = [
  AUTH_LOGIN_URL,
  SIGN_UP_URL,
  RESET_PASSWORD_URL,
  FORGOT_PASSWORD_URL,
];
const getShouldEnforceDarkTheme = () => {
  const currentPath = window.location.pathname;
  return enforceDarkThemeRoutes.some(
    (path: string) => currentPath.indexOf(path) !== -1,
  );
};

export const getThemeDetails = (state: AppState) => {
  const currentPath = window.location.pathname;
  const isBuilderOrViewerPath = !!currentPath.match(VIEWER_URL_REGEX);
  const isViewerPath =
    isBuilderOrViewerPath && currentPath.indexOf("edit") === -1;

  if (isViewerPath) {
    return {
      mode: state.ui.theme.mode,
      theme: { ...theme, colors: { ...theme.colors, ...light } },
    };
  }

  if (isBuilderOrViewerPath || getShouldEnforceDarkTheme()) {
    return {
      mode: state.ui.theme.mode,
      theme: { ...theme, colors: { ...theme.colors, ...dark } },
    };
  }

  return {
    theme: state.ui.theme.theme,
    mode: state.ui.theme.mode,
  };
};

export const getAppCardColorPallete = (state: AppState) => {
  return state.ui.theme.theme.colors.appCardColors;
};
