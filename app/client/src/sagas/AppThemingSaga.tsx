import type {
  ChangeSelectedAppThemeAction,
  DeleteAppThemeAction,
  FetchAppThemesAction,
  FetchSelectedAppThemeAction,
  UpdateSelectedAppThemeAction,
} from "actions/appThemingActions";
import { updateisBetaCardShownAction } from "actions/appThemingActions";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { AppThemingApi } from "api";
import {
  all,
  takeLatest,
  put,
  select,
  call,
  type SagaReturnType,
} from "redux-saga/effects";
import { toast } from "@appsmith/ads";
import {
  CHANGE_APP_THEME,
  createMessage,
  DELETE_APP_THEME,
  SET_DEFAULT_SELECTED_THEME,
} from "ee/constants/messages";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { updateReplayEntity } from "actions/pageActions";
import { getCanvasWidgets } from "ee/selectors/entitiesSelector";
import { getAppMode } from "ee/selectors/applicationSelectors";
import type { APP_MODE } from "entities/App";
import { getCurrentUser } from "selectors/usersSelectors";
import type { User } from "constants/userConstants";
import { getBetaFlag, setBetaFlag, STORAGE_KEYS } from "utils/storage";
import type { UpdateWidgetPropertyPayload } from "actions/controlActions";
import { batchUpdateMultipleWidgetProperties } from "actions/controlActions";
import { getPropertiesToUpdateForReset } from "entities/AppTheming/utils";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import {
  getCurrentApplicationId,
  selectApplicationVersion,
} from "selectors/editorSelectors";
import { find } from "lodash";
import captureException from "instrumentation/sendFaroErrors";
import { getAllPageIdentities } from "./selectors";
import type { SagaIterator } from "@redux-saga/types";
import type { AxiosPromise } from "axios";
import { getFromServerWhenNoPrefetchedResult } from "./helper";

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
    const { applicationId, themes } = action.payload;

    const response: SagaReturnType<typeof AppThemingApi.fetchThemes> =
      yield call(getFromServerWhenNoPrefetchedResult, themes, async () =>
        AppThemingApi.fetchThemes(applicationId),
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
): SagaIterator | AxiosPromise {
  const { applicationId, currentTheme } = action.payload;
  const mode: APP_MODE = yield select(getAppMode);

  const pageIdentities: { pageId: string; basePageId: string }[] =
    yield select(getAllPageIdentities);
  const userDetails = yield select(getCurrentUser);
  const applicationVersion = yield select(selectApplicationVersion);

  try {
    const response: SagaReturnType<typeof AppThemingApi.fetchSelected> =
      yield call(getFromServerWhenNoPrefetchedResult, currentTheme, async () =>
        AppThemingApi.fetchSelected(applicationId, mode),
      );

    if (response?.data) {
      yield put({
        type: ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
        payload: response.data,
      });
    } else {
      captureException(new Error("Unable to fetch the selected theme"), {
        errorName: "ThemeFetchError",
        extra: {
          pageIdentities,
          applicationId,
          applicationVersion,
          userDetails,
          themeResponse: response,
        },
      });

      // If the response.data is undefined then we set selectedTheme to default Theme
      yield put({
        type: ReduxActionTypes.SET_DEFAULT_SELECTED_THEME_INIT,
      });
    }
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
    yield AppThemingApi.updateTheme(applicationId, theme);

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
    yield AppThemingApi.changeTheme(applicationId, theme);

    yield put({
      type: ReduxActionTypes.CHANGE_SELECTED_APP_THEME_SUCCESS,
      payload: theme,
    });

    // shows toast
    toast.show(createMessage(CHANGE_APP_THEME, theme.displayName), {
      kind: "success",
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
 * deletes custom saved theme
 *
 * @param action
 */
export function* deleteTheme(action: ReduxAction<DeleteAppThemeAction>) {
  const { name, themeId } = action.payload;

  try {
    yield AppThemingApi.deleteTheme(themeId);

    yield put({
      type: ReduxActionTypes.DELETE_APP_THEME_SUCCESS,
      payload: { themeId },
    });

    // shows toast
    toast.show(createMessage(DELETE_APP_THEME, name), {
      kind: "success",
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
    const canvasWidgets: CanvasWidgetsReduxState =
      yield select(getCanvasWidgets);
    const propertiesToUpdate: UpdateWidgetPropertyPayload[] =
      getPropertiesToUpdateForReset(canvasWidgets);

    if (propertiesToUpdate.length) {
      yield put(batchUpdateMultipleWidgetProperties(propertiesToUpdate));
    }
  } catch (error) {}
}

/**
 * sets the selectedTheme to default theme when Selected Theme API fails
 */
function* setDefaultSelectedThemeOnError() {
  const applicationId: string = yield select(getCurrentApplicationId);

  try {
    // Fetch all system themes
    const response: SagaReturnType<typeof AppThemingApi.fetchThemes> =
      yield AppThemingApi.fetchThemes(applicationId);

    // Gets default theme
    const theme = find(response.data, { name: "Default" });

    if (theme) {
      // Update API call to set current theme to default
      yield AppThemingApi.changeTheme(applicationId, theme);
      yield put({
        type: ReduxActionTypes.FETCH_SELECTED_APP_THEME_SUCCESS,
        payload: theme,
      });
      // shows toast
      toast.show(createMessage(SET_DEFAULT_SELECTED_THEME, theme.displayName), {
        kind: "warning",
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SET_DEFAULT_SELECTED_THEME_ERROR,
      payload: { error },
    });
  }
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
    takeLatest(ReduxActionTypes.DELETE_APP_THEME_INIT, deleteTheme),
    takeLatest(ReduxActionTypes.CLOSE_BETA_CARD_SHOWN, closeisBetaCardShown),
    takeLatest(
      ReduxActionTypes.SET_DEFAULT_SELECTED_THEME_INIT,
      setDefaultSelectedThemeOnError,
    ),
  ]);
}
