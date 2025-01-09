import type { ReduxAction } from "../actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { select, takeLatest } from "redux-saga/effects";
import localStorage from "utils/localStorage";
import type { ThemeMode } from "selectors/themeSelectors";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { trimTrailingSlash } from "utils/helpers";

export interface BackgroundTheme {
  colors: { homepageBackground: string; appBackground: string };
}

export function changeAppBackground(currentTheme: BackgroundTheme) {
  if (
    trimTrailingSlash(window.location.pathname) === "/applications" ||
    window.location.pathname.indexOf("/settings/") !== -1 ||
    trimTrailingSlash(window.location.pathname) === "/profile" ||
    trimTrailingSlash(window.location.pathname) === "/signup-success"
  ) {
    document.body.style.backgroundColor =
      currentTheme.colors.homepageBackground;
  } else {
    document.body.style.backgroundColor = currentTheme.colors.appBackground;
  }
}

export function* setThemeSaga(actionPayload: ReduxAction<ThemeMode>) {
  const theme: BackgroundTheme = yield select(getCurrentThemeDetails);

  changeAppBackground(theme);
  yield localStorage.setItem("THEME", actionPayload.payload);
}

export default function* themeSagas() {
  yield takeLatest(ReduxActionTypes.SET_THEME, setThemeSaga);
}
