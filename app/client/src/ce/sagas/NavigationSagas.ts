import { fork, put, select } from "redux-saga/effects";
import { RouteChangeActionPayload } from "actions/focusHistoryActions";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import log from "loglevel";
import { Location } from "history";
import { AppsmithLocationState } from "utils/history";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getRecentEntityIds } from "selectors/globalSearchSelectors";
import { ReduxAction } from "ce/constants/ReduxActionConstants";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { BackgroundTheme, changeAppBackground } from "sagas/ThemeSaga";
import { updateRecentEntitySaga } from "sagas/GlobalSearchSagas";
import { isEditorPath } from "@appsmith/pages/Editor/Explorer/helpers";
import {
  setLastSelectedWidget,
  setSelectedWidgets,
} from "actions/widgetSelectionActions";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { contextSwitchingSaga } from "ce/sagas/ContextSwitchingSaga";

let previousPath: string;

export function* handleRouteChange(
  action: ReduxAction<RouteChangeActionPayload>,
) {
  const { pathname, state } = action.payload.location;
  try {
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

function* logNavigationAnalytics(payload: {
  location: Location<AppsmithLocationState>;
}) {
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
  let widgets: string[] | undefined;
  let lastSelectedWidget: string | undefined;
  if (entityInfo.entity === FocusEntity.PROPERTY_PANE) {
    widgets = entityInfo.id.split(",");
    if (widgets.length) {
      lastSelectedWidget = widgets[widgets.length - 1];
    }
  } else if (entityInfo.entity === FocusEntity.CANVAS) {
    widgets = [];
    lastSelectedWidget = MAIN_CONTAINER_WIDGET_ID;
  }
  if (Array.isArray(widgets)) {
    yield put(setSelectedWidgets(widgets));
  }
  if (lastSelectedWidget) {
    yield put(setLastSelectedWidget(lastSelectedWidget));
  }
}
