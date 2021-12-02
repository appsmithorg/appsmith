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
        primaryColor: "#f3f4f3",
        secondaryColor: "#f00",
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
        appBoxShadow: {
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
      "AUDIO_RECORDER_WIDGET.backgroundColor":
        "{{AppTheme.colors.primaryColor}}",
      "AUDIO_RECORDER_WIDGET.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "AUDIO_RECORDER_WIDGET.boxShadow":
        "{{AppTheme.borderRadius.appBoxShadow}}",
      "BUTTON_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "BUTTON_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "BUTTON_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "BUTTON_GROUP_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "BUTTON_GROUP_WIDGET.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "BUTTON_GROUP_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "CHART_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "CHART_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "CHART_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "CHECKBOX_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "CHECKBOX_WIDGET.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "CHECKBOX_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "CONTAINER_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "CONTAINER_WIDGET.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "CONTAINER_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "DATE_PICKER_WIDGET2.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "DATE_PICKER_WIDGET2.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "DATE_PICKER_WIDGET2.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "FILE_PICKER_WIDGET_V2.backgroundColor":
        "{{AppTheme.colors.primaryColor}}",
      "FILE_PICKER_WIDGET_V2.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "FILE_PICKER_WIDGET_V2.boxShadow":
        "{{AppTheme.borderRadius.appBoxShadow}}",
      "FORM_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "FORM_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "FORM_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "ICON_BUTTON_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "ICON_BUTTON_WIDGET.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "ICON_BUTTON_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "IFRAME_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "IFRAME_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "IFRAME_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "IMAGE_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "IMAGE_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "INPUT_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "INPUT_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "INPUT_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "LIST_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "LIST_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "LIST_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "MAP_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "MAP_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "MENU_BUTTON_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "MENU_BUTTON_WIDGET.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "MENU_BUTTON_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "MODAL_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "MODAL_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "MULTI_SELECT_TREE_WIDGET.backgroundColor":
        "{{AppTheme.colors.primaryColor}}",
      "MULTI_SELECT_TREE_WIDGET.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "MULTI_SELECT_TREE_WIDGET.boxShadow":
        "{{AppTheme.borderRadius.appBoxShadow}}",
      "MULTI_SELECT_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "MULTI_SELECT_WIDGET.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "MULTI_SELECT_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "DROPDOWN_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "RADIO_GROUP_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "RICH_TEXT_EDITOR_WIDGET.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "RICH_TEXT_EDITOR_WIDGET.boxShadow":
        "{{AppTheme.borderRadius.appBoxShadow}}",
      "STATBOX_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "STATBOX_WIDGET.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "STATBOX_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "SWITCH_WIDGET.backgroundColor": "{{AppTheme.colors.primaryColor}}",
      "TABLE_WIDGET.accentColor": "{{AppTheme.colors.primaryColor}}",
      "TABLE_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "TABLE_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "TABS_WIDGET.selectedTabColor": "{{AppTheme.colors.primaryColor}}",
      "TABS_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "TABS_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "TEXT_WIDGET.selectedTabColor": "{{AppTheme.colors.primaryColor}}",
      "TEXT_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "TEXT_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "VIDEO_WIDGET.selectedTabColor": "{{AppTheme.colors.primaryColor}}",
      "VIDEO_WIDGET.borderRadius": "{{AppTheme.borderRadius.appBorderRadius}}",
      "VIDEO_WIDGET.boxShadow": "{{AppTheme.borderRadius.appBoxShadow}}",
      "SINGLE_SELECT_TREE_WIDGET.selectedTabColor":
        "{{AppTheme.colors.primaryColor}}",
      "SINGLE_SELECT_TREE_WIDGET.borderRadius":
        "{{AppTheme.borderRadius.appBorderRadius}}",
      "SINGLE_SELECT_TREE_WIDGET.boxShadow":
        "{{AppTheme.borderRadius.appBoxShadow}}",
    },
    properties: {
      colors: {
        primaryColor: "#8B5CF6",
        secondaryColor: "#EDE9FE",
      },
      borderRadius: {
        appBorderRadius: "0.375rem",
        buttonBorderRadius: "0.375rem",
      },
      boxShadow: {
        appBoxShadow:
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
