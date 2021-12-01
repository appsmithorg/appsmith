import {
  FetchSelectedAppThemeAction,
  FetchAppThemesAction,
  UpdateSelectedAppThemeAction,
} from "actions/appThemingActions";
import AppThemingApi from "api/AppThemingApi";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { AppTheme } from "entities/AppTheming";
import { all, takeLatest, select, put } from "redux-saga/effects";

const dummyThemes: AppTheme[] = [
  {
    name: "Default Theme",
    created_at: "12/12/12",
    created_by: "@appsmith",
    config: {
      colors: {
        "Primary color": "#f3f4f3",
        "secondary color": "#f00",
      },
      borderRadius: {
        appBorderRadius: {
          none: "0px",
          DEFAULT: "0.25rem",
          md: "0.375rem",
          lg: "0.5rem",
          full: "9999px",
        },
        buttonBorderRadius: {
          none: "0px",
          md: "0.375rem",
          lg: "0.5rem",
        },
      },
      boxShadow: {
        appShadow: {
          none: "none",
          sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          DEFAULT:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          md:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          lg:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      },
      fontFamily: {
        appFont: {
          roboto: ["'roboto san-seriff'", "http://googlrfont"],
        },
      },
    },
    stylesheet: {
      "BUTTON.buttonColor": "{{Apptheme.colors.primary_colors}}",
      "BUTTON.borderRadius": "{{Apptheme.borderRadius.buttonBorderRadius}}",
    },
    properties: {
      colors: {
        "Primary color": "#8B5CF6",
        "secondary color": "#EDE9FE",
      },
      borderRadius: {
        appBorderRadius: "0.375rem",
        buttonBorderRadius: "0.375rem",
      },
      boxShadow: {
        appShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      },
      fontFamily: {
        appFont: ["'roboto san-seriff'", "http://googlrfont"],
      },
    },
    variants: {
      "Button.default.buttonColor": "{{Apptheme.colors.primary_colors}}",
    },
  },
];

/**
 * fetches all themes of the application
 *
 * @param action
 */
export function* fetchAppThemes(action: ReduxAction<FetchAppThemesAction>) {
  const { applicationId } = action.payload;

  try {
    // const response = yield ThemingApi.fetchThemes(applicationId);

    yield put({
      type: ReduxActionTypes.FETCH_APP_THEMES_SUCCESS,
      payload: dummyThemes,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_APP_THEMES_ERROR,
      payload: { error },
    });
  }
}

/**
 * fetches the selected theme of the application
 *
 * @param action
 */
export function* fetchAppSelectedTheme(
  action: ReduxAction<FetchSelectedAppThemeAction>,
) {
  const { applicationId } = action.payload;

  try {
    // const response = yield ThemingApi.fetchThemes(applicationId);

    yield put({
      type: ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
      payload: dummyThemes[0],
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_SELECTED_APP_THEME_ERROR,
      payload: { error },
    });
  }
}

/**
 * updates the selected theme of the application
 *
 * @param action
 */
export function* updateSelectedTheme(
  action: ReduxAction<UpdateSelectedAppThemeAction>,
) {
  const { applicationId, theme } = action.payload;

  try {
    // const response = yield ThemingApi.updateTheme(applicationId, theme);

    yield put({
      type: ReduxActionTypes.UPDATE_SELECTED_APP_THEME_SUCCESS,
      payload: theme,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_SELECTED_APP_THEME_ERROR,
      payload: { error },
    });
  }
}

export default function* appThemingSaga() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_APP_THEMES_INIT, fetchAppThemes),
    takeLatest(
      ReduxActionTypes.FETCH_SELECTED_APP_THEME_INIT,
      fetchAppSelectedTheme,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_SELECTED_APP_THEME_INIT,
      updateSelectedTheme,
    ),
  ]);
}
