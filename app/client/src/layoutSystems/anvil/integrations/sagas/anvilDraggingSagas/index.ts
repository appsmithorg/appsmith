import { ReduxActionErrorTypes } from "ee/constants/ReduxActionConstants";
import { type ReduxAction } from "actions/ReduxActionTypes";
import log from "loglevel";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
} from "layoutSystems/anvil/utils/anvilTypes";
import { getWidgets } from "sagas/selectors";
import type { AnvilMoveWidgetsPayload } from "../../actions/actionTypes";
import { AnvilReduxActionTypes } from "../../actions/actionTypes";
import { moveWidgetsToMainCanvas } from "layoutSystems/anvil/utils/layouts/update/mainCanvasLayoutUtils";

import { moveWidgetsToSection } from "layoutSystems/anvil/utils/layouts/update/sectionUtils";
import { updateAndSaveAnvilLayout } from "../../../utils/anvilChecksUtils";
import {
  isRedundantZoneWidget,
  isZoneWidget,
  moveWidgetsToZone,
} from "layoutSystems/anvil/utils/layouts/update/zoneUtils";
import { severTiesFromParents } from "../../../utils/layouts/update/moveUtils";
import { widgetChildren } from "../../../utils/layouts/widgetUtils";

/**
 * Remove widgets from current parents and layouts.
 * Add to new parent and layout.
 */
export function* moveWidgetsSaga(
  actionPayload: ReduxAction<AnvilMoveWidgetsPayload>,
) {
  try {
    const start = performance.now();
    const {
      dragMeta: { draggedOn },
      highlight,
      movedWidgets,
    } = actionPayload.payload;
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const parentWidgetWithLayout = allWidgets[highlight.canvasId];
    const isMainCanvas =
      draggedOn === "MAIN_CANVAS" || !!parentWidgetWithLayout.detachFromLayout;
    const isSection = draggedOn === "SECTION";
    const movedWidgetIds = movedWidgets.map((each) => each.widgetId);

    let updatedWidgets: CanvasWidgetsReduxState = yield call<
      typeof handleWidgetMovement
    >(
      handleWidgetMovement,
      allWidgets,
      movedWidgetIds,
      highlight,
      isMainCanvas,
      isSection,
    );

    updatedWidgets = handleDeleteRedundantZones(updatedWidgets, movedWidgets);

    yield call(updateAndSaveAnvilLayout, updatedWidgets);
    log.debug("Anvil : moving widgets took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_MOVE_WIDGET,
        error,
      },
    });
  }
}

export function* handleWidgetMovement(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgetIds: string[],
  highlight: AnvilHighlightInfo,
  isMainCanvas: boolean,
  isSection: boolean,
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };

  if (isMainCanvas) {
    /**
     * * Widgets are dropped on to Main Canvas.
     */
    updatedWidgets = yield call(
      moveWidgetsToMainCanvas,
      allWidgets,
      movedWidgetIds,
      highlight,
    );
  } else if (isSection) {
    /**
     * Widget are dropped into a Section.
     */
    updatedWidgets = yield call(
      moveWidgetsToSection,
      allWidgets,
      movedWidgetIds,
      highlight,
    );
  } else {
    updatedWidgets = yield call(
      moveWidgetsToZone,
      allWidgets,
      movedWidgetIds,
      highlight,
    );
  }

  return updatedWidgets;
}

export function handleDeleteRedundantZones(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: DraggedWidget[],
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  const parentIds = movedWidgets
    .map((widget) => widget.parentId)
    .filter(Boolean) as string[];

  for (const parentId of parentIds) {
    const zone = updatedWidgets[parentId];

    if (!isZoneWidget(zone) || !zone.parentId) continue;

    const parentSection = updatedWidgets[zone.parentId];

    if (!parentSection || !isRedundantZoneWidget(zone, parentSection)) continue;

    updatedWidgets = severTiesFromParents(updatedWidgets, [zone.widgetId]);
    delete updatedWidgets[zone.widgetId];

    if (widgetChildren(parentSection).length === 1) {
      updatedWidgets = severTiesFromParents(updatedWidgets, [zone.parentId]);
      delete updatedWidgets[zone.parentId];
    }
  }

  return updatedWidgets;
}

export default function* anvilDraggingSagas() {
  yield all([
    takeLatest(AnvilReduxActionTypes.ANVIL_MOVE_WIDGET, moveWidgetsSaga),
  ]);
}
