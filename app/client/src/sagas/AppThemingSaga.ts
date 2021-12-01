import {
  FetchSelectedAppThemeAction,
  FetchAppThemesAction,
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
    config: {
      colors: {
        "Primary color": "#f3f4f3",
        "secondary color": "#f00",
      },
      borderRadius: {
        appBorderRadius: {
          none: "0px",
          x: "2px",
          XL: "4px",
          XXL: "6px",
        },
        buttonBorderRadius: {
          none: "0px",
          x: "2px",
          XL: "4px",
          XXL: "6px",
        },
      },
      boxShadow: {
        appShadow: {
          x: "0px 0px 3px",
        },
      },
      boxShadowColor: {
        appShadowColor: "#f4f4f4",
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
        appBorderRadius: "6px",
        buttonBorderRadius: "2px",
      },
      boxShadow: {
        appShadow: "0px 0px 3px",
      },
      boxShadowColor: {
        appShadowColor: "#f4f4f4",
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

export default function* appThemingSaga() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_APP_THEMES_INIT, fetchAppThemes),
  ]);
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_SELECTED_APP_THEME_INIT,
      fetchAppSelectedTheme,
    ),
  ]);
}
