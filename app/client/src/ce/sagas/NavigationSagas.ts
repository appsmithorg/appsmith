import { fork, put, select } from "redux-saga/effects";
import type { RouteChangeActionPayload } from "actions/focusHistoryActions";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import log from "loglevel";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getRecentEntityIds } from "selectors/globalSearchSelectors";
import type { ReduxAction } from "ce/constants/ReduxActionConstants";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import type { BackgroundTheme } from "sagas/ThemeSaga";
import { changeAppBackground } from "sagas/ThemeSaga";
import { updateRecentEntitySaga } from "sagas/GlobalSearchSagas";
import { isEditorPath } from "@appsmith/pages/Editor/Explorer/helpers";
import {
  setLastSelectedWidget,
  setSelectedWidgets,
} from "actions/widgetSelectionActions";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { contextSwitchingSaga } from "ce/sagas/ContextSwitchingSaga";
import { getSafeCrash } from "selectors/errorSelectors";
import { flushErrors } from "actions/errorActions";

let previousPath: string;

export function* handleRouteChange(
  action: ReduxAction<RouteChangeActionPayload>,
) {
  const { pathname, state } = action.payload.location;
  try {
    yield fork(clearErrors);
    const isAnEditorPath = isEditorPath(pathname);

    // handled only on edit mode
    if (isAnEditorPath) {
      yield fork(logNavigationAnalytics, action.payload);
      yield fork(contextSwitchingSaga, pathname, previousPath, state);
      yield fork(appBackgroundHandler);
      const entityInfo = identifyEntityFromPath(pathname);
      yield fork(updateRecentEntitySaga, entityInfo);
      yield fork(setSelectedWidgetsSaga);
    }
  } catch (e) {
    log.error("Error in focus change", e);
  } finally {
    previousPath = pathname;
  }
}

function* appBackgroundHandler() {
  const currentTheme: BackgroundTheme = yield select(getCurrentThemeDetails);
  changeAppBackground(currentTheme);
}

/**
 * When an error occurs, we take over the whole router and keep it the error
 * state till the errors are flushed. By default, we will flush out the
 * error state when a CTA on the page is clicked but in case the
 * user navigates via the browser buttons, this will ensure
 * the errors are flushed
 * */
function* clearErrors() {
  const isCrashed: boolean = yield select(getSafeCrash);
  if (isCrashed) {
    yield put(flushErrors());
  }
}

function* logNavigationAnalytics(payload: RouteChangeActionPayload) {
  const {
    location: { pathname, state },
  } = payload;
  const recentEntityIds: Array<string> = yield select(getRecentEntityIds);
  const currentEntity = identifyEntityFromPath(pathname);
  const previousEntity = identifyEntityFromPath(previousPath);
  const isRecent = recentEntityIds.some(
    (entityId) => entityId === currentEntity.id,
  );
  AnalyticsUtil.logEvent("ROUTE_CHANGE", {
    toPath: pathname,
    fromPath: previousPath || undefined,
    navigationMethod: state?.invokedBy,
    isRecent,
    recentLength: recentEntityIds.length,
    toType: currentEntity.entity,
    fromType: previousEntity.entity,
  });
}

function* setSelectedWidgetsSaga() {
  const pathname = window.location.pathname;
  const entityInfo = identifyEntityFromPath(pathname);
  let widgets: string[] = [];
  let lastSelectedWidget = MAIN_CONTAINER_WIDGET_ID;
  if (entityInfo.entity === FocusEntity.PROPERTY_PANE) {
    widgets = entityInfo.id.split(",");
    if (widgets.length) {
      lastSelectedWidget = widgets[widgets.length - 1];
    }
  }
  yield put(setSelectedWidgets(widgets));
  yield put(setLastSelectedWidget(lastSelectedWidget));
}
