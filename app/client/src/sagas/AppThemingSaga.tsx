import React from "react";
import { get, has } from "lodash";
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
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import { ROOT_SCHEMA_KEY } from "widgets/JSONFormWidget/constants";
import { parseSchemaItem } from "widgets/WidgetUtils";
import { getFieldStylesheet } from "widgets/JSONFormWidget/helper";

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
    const response = yield ThemingApi.fetchThemes(applicationId);

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
    const response = yield ThemingApi.fetchSelected(applicationId, mode);

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
  const canvasWidgets = yield select(getCanvasWidgets);

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
  const canvasWidgets = yield select(getCanvasWidgets);

  try {
    yield ThemingApi.changeTheme(applicationId, theme);

    yield put({
      type: ReduxActionTypes.CHANGE_SELECTED_APP_THEME_SUCCESS,
      payload: theme,
    });

    // shows toast
    Toaster.show({
      text: createMessage(CHANGE_APP_THEME, theme.name),
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
    const response = yield ThemingApi.saveTheme(applicationId, { name });

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
    const propertiesToUpdate: UpdateWidgetPropertyPayload[] = [];
    const canvasWidgets = yield select(getCanvasWidgets);
    const themeStylesheet = yield select(getSelectedAppThemeStylesheet);

    const propertiesToIgnore = [
      "childStylesheet",
      "submitButtonStyles",
      "resetButtonStyles",
    ];

    // return;

    Object.keys(canvasWidgets).map((widgetId) => {
      const widget = canvasWidgets[widgetId];
      const stylesheetValue = themeStylesheet[widget.type];
      const modifications: any = {};

      if (stylesheetValue) {
        Object.keys(stylesheetValue).map((propertyKey) => {
          if (
            stylesheetValue[propertyKey] !== widget[propertyKey] &&
            propertiesToIgnore.includes(propertyKey) === false
          ) {
            modifications[propertyKey] = stylesheetValue[propertyKey];
          }
        });

        if (widget.type === "TABLE_WIDGET") {
          Object.keys(widget.primaryColumns).map((primaryColumnKey) => {
            const primaryColumn = widget.primaryColumns[primaryColumnKey];
            const childStylesheetValue =
              widget.childStylesheet[primaryColumn.columnType];

            if (childStylesheetValue) {
              Object.keys(childStylesheetValue).map((childPropertyKey) => {
                const { jsSnippets, stringSegments } = getDynamicBindings(
                  childStylesheetValue[childPropertyKey],
                );

                const js = combineDynamicBindings(jsSnippets, stringSegments);
                const computedValue = `{{${widget.widgetName}.sanitizedTableData.map((currentRow) => ( ${js}))}}`;

                if (computedValue !== primaryColumn[childPropertyKey]) {
                  modifications[
                    `primaryColumns.${primaryColumnKey}.${childPropertyKey}`
                  ] = computedValue;
                }
              });
            }
          });
        }

        if (widget.type === "BUTTON_GROUP_WIDGET") {
          Object.keys(widget.groupButtons).map((groupButtonName: string) => {
            const groupButton = widget.groupButtons[groupButtonName];

            const childStylesheetValue = stylesheetValue.childStylesheet.button;

            Object.keys(childStylesheetValue).map((childPropertyKey) => {
              if (
                childStylesheetValue[childPropertyKey] !==
                groupButton[childPropertyKey]
              ) {
                modifications[
                  `groupButtons.${groupButtonName}.${childPropertyKey}`
                ] = childStylesheetValue[childPropertyKey];
              }
            });
          });
        }

        if (widget.type === "JSON_FORM_WIDGET") {
          if (has(widget, "schema")) {
            parseSchemaItem(
              widget.schema[ROOT_SCHEMA_KEY],
              `schema.${ROOT_SCHEMA_KEY}`,
              (schemaItem, propertyPath) => {
                const fieldStylesheet = getFieldStylesheet(
                  schemaItem.fieldType,
                  themeStylesheet[widget.type].childStylesheet,
                );

                Object.keys(fieldStylesheet).map((fieldPropertyKey) => {
                  const fieldStylesheetValue =
                    fieldStylesheet[fieldPropertyKey];

                  if (
                    fieldStylesheetValue !== get(schemaItem, fieldPropertyKey)
                  ) {
                    modifications[
                      `${[propertyPath]}.${fieldPropertyKey}`
                    ] = fieldStylesheetValue;
                  }
                });
              },
            );
          }

          // reset submit button
          ["submitButtonStyles", "resetButtonStyles"].map((buttonStyleKey) => {
            Object.keys(stylesheetValue[buttonStyleKey]).map((propertyKey) => {
              const buttonStylesheetValue =
                stylesheetValue[buttonStyleKey][propertyKey];

              if (
                buttonStylesheetValue !== widget[buttonStyleKey][propertyKey]
              ) {
                modifications[
                  `${buttonStyleKey}.${propertyKey}`
                ] = buttonStylesheetValue;
              }
            });
          });
        }

        if (Object.keys(modifications).length > 0) {
          propertiesToUpdate.push({
            widgetId,
            updates: {
              modify: modifications,
            },
          });
        }
      }
    });

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
