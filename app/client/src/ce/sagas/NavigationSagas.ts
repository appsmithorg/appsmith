import { fork, put, select, call } from "redux-saga/effects";
import type { RouteChangeActionPayload } from "actions/focusHistoryActions";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import log from "loglevel";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getRecentEntityIds } from "selectors/globalSearchSelectors";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import type { BackgroundTheme } from "sagas/ThemeSaga";
import { changeAppBackground } from "sagas/ThemeSaga";
import { updateRecentEntitySaga } from "sagas/GlobalSearchSagas";
import {
  setLastSelectedWidget,
  setSelectedWidgets,
} from "actions/widgetSelectionActions";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import FocusRetention from "sagas/FocusRetentionSaga";
import { getSafeCrash } from "selectors/errorSelectors";
import { flushErrors } from "actions/errorActions";
import type { NavigationMethod } from "utils/history";
import UsagePulse from "usagePulse";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import type { EditorViewMode } from "ee/entities/IDE/constants";
import { IDE_TYPE } from "ee/entities/IDE/constants";
import { updateIDETabsOnRouteChangeSaga } from "sagas/IDESaga";
import { getIDEViewMode } from "selectors/ideSelectors";

let previousPath: string;

export function* handleRouteChange(
  action: ReduxAction<RouteChangeActionPayload>,
) {
  const { pathname, state } = action.payload.location;
  try {
    yield fork(clearErrors);
    yield fork(watchForTrackableUrl, action.payload);
    const ideType = getIDETypeByUrl(pathname);
    const isAnEditorPath = ideType !== IDE_TYPE.None;

    // handled only on edit mode
    if (isAnEditorPath) {
      yield fork(
        FocusRetention.onRouteChange.bind(FocusRetention),
        pathname,
        previousPath,
        state,
      );
      if (ideType === IDE_TYPE.App) {
        yield fork(logNavigationAnalytics, action.payload);
        yield fork(appBackgroundHandler);
        const entityInfo = identifyEntityFromPath(pathname);
        yield fork(updateRecentEntitySaga, entityInfo);
        yield fork(updateIDETabsOnRouteChangeSaga, entityInfo);
        yield fork(setSelectedWidgetsSaga, state?.invokedBy);
      }
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

function* watchForTrackableUrl(payload: RouteChangeActionPayload) {
  const oldPathname = payload.prevLocation.pathname;
  const newPathname = payload.location.pathname;
  const isOldPathTrackable: boolean = yield call(
    UsagePulse.isTrackableUrl,
    oldPathname,
  );
  const isNewPathTrackable: boolean = yield call(
    UsagePulse.isTrackableUrl,
    newPathname,
  );

  // Trackable to Trackable URL -> No pulse
  // Non-Trackable to Non-Trackable URL -> No pulse
  // Trackable to Non-Trackable -> No Pulse
  // Non-Trackable to Trackable URL -> Send Pulse

  if (!isOldPathTrackable && isNewPathTrackable) {
    yield call(UsagePulse.sendPulseAndScheduleNext);
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
  const ideViewMode: EditorViewMode = yield select(getIDEViewMode);
  const { height, width } = window.screen;
  AnalyticsUtil.logEvent("ROUTE_CHANGE", {
    toPath: pathname,
    fromPath: previousPath || undefined,
    navigationMethod: state?.invokedBy,
    isRecent,
    recentLength: recentEntityIds.length,
    toType: currentEntity.entity,
    fromType: previousEntity.entity,
    screenHeight: height,
    screenWidth: width,
    editorMode: ideViewMode,
  });
}

function* setSelectedWidgetsSaga(invokedBy?: NavigationMethod) {
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
  yield put(setSelectedWidgets(widgets, invokedBy));
  yield put(setLastSelectedWidget(lastSelectedWidget));
}
