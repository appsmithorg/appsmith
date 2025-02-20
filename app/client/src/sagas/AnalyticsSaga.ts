import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ReduxActionType } from "actions/ReduxActionTypes";
import type { Action } from "entities/Action";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  RequestPayloadAnalyticsPath,
  cleanValuesInObjectForHashing,
  generateHashFromString,
} from "./helper";
import get from "lodash/get";
import log from "loglevel";
import { all, put, select, takeEvery } from "redux-saga/effects";
import { getIdeCanvasSideBySideHoverState } from "selectors/ideSelectors";

import { EditorViewMode } from "IDE/Interfaces/EditorTypes";
import {
  recordAnalyticsForSideBySideNavigation,
  recordAnalyticsForSideBySideWidgetHover,
  resetAnalyticsForSideBySideHover,
} from "actions/ideActions";

import type { routeChanged } from "actions/focusHistoryActions";
import { NavigationMethod } from "utils/history";
import { getIDEViewMode } from "selectors/ideSelectors";

import {
  JS_COLLECTION_EDITOR_PATH,
  QUERIES_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_BASE_PATH,
} from "constants/routes";
import type { focusWidget } from "actions/widgetActions";
import { getCanvasWidgets } from "ee/selectors/entitiesSelector";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { isInSideBySideEditor } from "IDE/utils/isInSideBySideEditor";
import { getCurrentEntityInfo } from "IDE/utils/getCurrentEntityInfo";

export function* sendAnalyticsEventSaga(
  type: ReduxActionType,
  payload: unknown,
) {
  try {
    switch (type) {
      case ReduxActionTypes.UPDATE_ACTION_INIT:
        const { action, pageName } = payload as {
          action: Action;
          pageName: string;
        };
        const cleanActionConfiguration = cleanValuesInObjectForHashing(
          action.actionConfiguration,
        );
        const actionConfigurationHash: string = yield generateHashFromString(
          JSON.stringify(cleanActionConfiguration),
        );

        const originalActionId = get(
          action,
          `${RequestPayloadAnalyticsPath}.originalActionId`,
          action.id,
        );

        AnalyticsUtil.logEvent("SAVE_ACTION", {
          actionName: action.name,
          pageName: pageName,
          originalActionId: originalActionId,
          actionId: action.id,
          hash: actionConfigurationHash,
          actionType: action.pluginType,
          actionPlugin: action.pluginId,
        });
    }
  } catch (e) {
    log.error("Failed to send analytics event");
  }
}

function* sendSideBySideWidgetHoverAnalyticsEventSaga() {
  const {
    navigated,
    widgetTypes,
  }: ReturnType<typeof getIdeCanvasSideBySideHoverState> = yield select(
    getIdeCanvasSideBySideHoverState,
  );

  const payload = {
    navigated,
    widgetHover: widgetTypes.length > 0,
    widgetTypes: Array.from(new Set(widgetTypes)),
  };

  yield put(resetAnalyticsForSideBySideHover());

  AnalyticsUtil.logEvent("CANVAS_HOVER", payload);
}

function* routeChangeInSideBySideModeSaga({
  payload,
}: ReturnType<typeof routeChanged>) {
  const viewMode: ReturnType<typeof getIDEViewMode> =
    yield select(getIDEViewMode);

  const {
    location: { pathname: pathName, state },
    prevLocation: { pathname: prevPathName },
  } = payload;

  const invokedBy = state?.invokedBy;

  if (
    invokedBy === NavigationMethod.CanvasClick &&
    viewMode === EditorViewMode.SplitScreen &&
    pathName.includes(WIDGETS_EDITOR_BASE_PATH) &&
    (prevPathName.includes(JS_COLLECTION_EDITOR_PATH) ||
      prevPathName.includes(QUERIES_EDITOR_BASE_PATH))
  ) {
    yield put(recordAnalyticsForSideBySideNavigation());
    yield sendSideBySideWidgetHoverAnalyticsEventSaga();
  }
}

function* focusWidgetInSideBySideModeSaga({
  payload,
}: ReturnType<typeof focusWidget>) {
  const { widgetId } = payload;

  if (widgetId) {
    const viewMode: ReturnType<typeof getIDEViewMode> =
      yield select(getIDEViewMode);

    const { appState, entity } = identifyEntityFromPath(
      window.location.pathname,
    );

    const { segment } = getCurrentEntityInfo(entity);

    if (isInSideBySideEditor({ appState, segment, viewMode })) {
      const widgets: ReturnType<typeof getCanvasWidgets> =
        yield select(getCanvasWidgets);
      const widget = widgets[widgetId];

      if (widget) {
        yield put(recordAnalyticsForSideBySideWidgetHover(widget.type));
      }
    }
  }
}

export default function* root() {
  yield all([
    takeEvery(
      ReduxActionTypes.SEND_ANALYTICS_FOR_SIDE_BY_SIDE_HOVER,
      sendSideBySideWidgetHoverAnalyticsEventSaga,
    ),

    takeEvery(ReduxActionTypes.ROUTE_CHANGED, routeChangeInSideBySideModeSaga),
    takeEvery(ReduxActionTypes.FOCUS_WIDGET, focusWidgetInSideBySideModeSaga),
  ]);
}
