import React from "react";
import {
  ChangeSelectedAppThemeAction,
  DeleteAppThemeAction,
  FetchAppThemesAction,
  FetchSelectedAppThemeAction,
  SaveAppThemeAction,
  updateisBetaCardShownAction,
  UpdateSelectedAppThemeAction,
} from "actions/appThemingActions";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import ThemingApi from "api/AppThemingApi";
import { all, takeLatest, put, select } from "redux-saga/effects";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import {
  CHANGE_APP_THEME,
  createMessage,
  DELETE_APP_THEME,
  SAVE_APP_THEME,
} from "@appsmith/constants/messages";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { undoAction, updateReplayEntity } from "actions/pageActions";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import store from "store";
import { getAppMode } from "selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { getCurrentUser } from "selectors/usersSelectors";
import { User } from "constants/userConstants";
import { getBetaFlag, setBetaFlag, STORAGE_KEYS } from "utils/storage";
import { getSelectedAppThemeStylesheet } from "selectors/appThemingSelectors";
import {
  batchUpdateMultipleWidgetProperties,
  UpdateWidgetPropertyPayload,
} from "actions/controlActions";
import { getPropertiesToUpdateForReset } from "entities/AppTheming/utils";
import { ApiResponse } from "api/ApiResponses";
import { AppTheme } from "entities/AppTheming";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

/**
 * init app theming
 */
export function* initAppTheming() {
  try {
    const user: User = yield select(getCurrentUser);
    const { email } = user;
    if (email) {
      const appThemingBetaFlag: boolean = yield getBetaFlag(
        email,
        STORAGE_KEYS.APP_THEMING_BETA_SHOWN,
      );

      yield put(updateisBetaCardShownAction(appThemingBetaFlag));
    }
  } catch (error) {}
}

/**
 * fetches all themes of the application
 *
 * @param action
 */
// eslint-disable-next-line
export function* fetchAppThemes(action: ReduxAction<FetchAppThemesAction>) {
  try {
    const { applicationId } = action.payload;
    const response: ApiResponse<AppTheme> = yield ThemingApi.fetchThemes(
      applicationId,
    );

    yield put({
      type: ReduxActionTypes.FETCH_APP_THEMES_SUCCESS,
      payload: response.data,
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
  // eslint-disable-next-line
  action: ReduxAction<FetchSelectedAppThemeAction>,
) {
  const { applicationId } = action.payload;
  const mode: APP_MODE = yield select(getAppMode);

  try {
    // eslint-disable-next-line
    const response: ApiResponse<AppTheme[]> = yield ThemingApi.fetchSelected(
      applicationId,
      mode,
    );

    yield put({
      type: ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
      payload: response.data,
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
  // eslint-disable-next-line
  const { shouldReplay = true, theme, applicationId } = action.payload;
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getCanvasWidgets);

  try {
    yield ThemingApi.updateTheme(applicationId, theme);

    yield put({
      type: ReduxActionTypes.UPDATE_SELECTED_APP_THEME_SUCCESS,
      payload: theme,
    });

    if (shouldReplay) {
      yield put(
        updateReplayEntity(
          "canvas",
          { widgets: canvasWidgets, theme },
          ENTITY_TYPE.WIDGET,
        ),
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_SELECTED_APP_THEME_ERROR,
      payload: { error },
    });
  }
}

/**
 * changes eelcted theme
 *
 * @param action
 */
export function* changeSelectedTheme(
  action: ReduxAction<ChangeSelectedAppThemeAction>,
) {
  const { applicationId, shouldReplay = true, theme } = action.payload;
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getCanvasWidgets);

  try {
    yield ThemingApi.changeTheme(applicationId, theme);

    yield put({
      type: ReduxActionTypes.CHANGE_SELECTED_APP_THEME_SUCCESS,
      payload: theme,
    });

    // shows toast
    Toaster.show({
      text: createMessage(CHANGE_APP_THEME, theme.displayName),
      variant: Variant.success,
      actionElement: (
        <span onClick={() => store.dispatch(undoAction())}>Undo</span>
      ),
    });

    if (shouldReplay) {
      yield put(
        updateReplayEntity(
          "canvas",
          { widgets: canvasWidgets, theme },
          ENTITY_TYPE.WIDGET,
        ),
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_SELECTED_APP_THEME_ERROR,
      payload: { error },
    });
  }
}

/**
 * save and create new theme from  selected theme
 *
 * @param action
 */
export function* saveSelectedTheme(action: ReduxAction<SaveAppThemeAction>) {
  const { applicationId, name } = action.payload;

  try {
    const response: ApiResponse<AppTheme[]> = yield ThemingApi.saveTheme(
      applicationId,
      { name },
    );

    yield put({
      type: ReduxActionTypes.SAVE_APP_THEME_SUCCESS,
      payload: response.data,
    });

    // shows toast
    Toaster.show({
      text: createMessage(SAVE_APP_THEME, name),
      variant: Variant.success,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_APP_THEME_ERROR,
      payload: { error },
    });
  }
}

/**
 * deletes custom saved theme
 *
 * @param action
 */
export function* deleteTheme(action: ReduxAction<DeleteAppThemeAction>) {
  const { name, themeId } = action.payload;

  try {
    yield ThemingApi.deleteTheme(themeId);

    yield put({
      type: ReduxActionTypes.DELETE_APP_THEME_SUCCESS,
      payload: { themeId },
    });

    // shows toast
    Toaster.show({
      text: createMessage(DELETE_APP_THEME, name),
      variant: Variant.success,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_APP_THEME_ERROR,
      payload: { error },
    });
  }
}

function* closeisBetaCardShown() {
  try {
    const user: User = yield select(getCurrentUser);
    const { email } = user;
    if (email) {
      yield setBetaFlag(email, STORAGE_KEYS.APP_THEMING_BETA_SHOWN, true);
    }
  } catch (error) {}
}

/**
 * resets widget styles
 */
function* resetTheme() {
  try {
    const canvasWidgets: CanvasWidgetsReduxState = yield select(
      getCanvasWidgets,
    );
    // @ts-expect-error: Type the StyleSheet
    const themeStylesheet = yield select(getSelectedAppThemeStylesheet);

    const propertiesToUpdate: UpdateWidgetPropertyPayload[] = getPropertiesToUpdateForReset(
      canvasWidgets,
      themeStylesheet,
    );

    if (propertiesToUpdate.length) {
      yield put(batchUpdateMultipleWidgetProperties(propertiesToUpdate));
    }
  } catch (error) {}
}

export default function* appThemingSaga() {
  yield all([takeLatest(ReduxActionTypes.INITIALIZE_EDITOR, initAppTheming)]);
  yield all([
    takeLatest(ReduxActionTypes.FETCH_APP_THEMES_INIT, fetchAppThemes),
    takeLatest(ReduxActionTypes.RESET_APP_THEME_INIT, resetTheme),
    takeLatest(
      ReduxActionTypes.FETCH_SELECTED_APP_THEME_INIT,
      fetchAppSelectedTheme,
    ),
    takeLatest(
      ReduxActionTypes.UPDATE_SELECTED_APP_THEME_INIT,
      updateSelectedTheme,
    ),
    takeLatest(
      ReduxActionTypes.CHANGE_SELECTED_APP_THEME_INIT,
      changeSelectedTheme,
    ),
    takeLatest(ReduxActionTypes.SAVE_APP_THEME_INIT, saveSelectedTheme),
    takeLatest(ReduxActionTypes.DELETE_APP_THEME_INIT, deleteTheme),
    takeLatest(ReduxActionTypes.CLOSE_BETA_CARD_SHOWN, closeisBetaCardShown),
  ]);
}
