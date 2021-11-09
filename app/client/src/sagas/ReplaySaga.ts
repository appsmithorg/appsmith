import { takeEvery, put, select, call, take } from "redux-saga/effects";

import * as Sentry from "@sentry/react";
import log from "loglevel";

import {
  getIsPropertyPaneVisible,
  getCurrentWidgetId,
} from "../selectors/propertyPaneSelectors";
import {
  closePropertyPane,
  forceOpenPropertyPane,
} from "actions/widgetActions";
import {
  selectMultipleWidgetsInitAction,
  selectWidgetAction,
} from "actions/widgetSelectionActions";
import {
  ReduxAction,
  ReduxActionTypes,
  ReplayReduxActionTypes,
} from "constants/ReduxActionConstants";
import { flashElementsById } from "utils/helpers";
import {
  scrollWidgetIntoView,
  processUndoRedoToasts,
} from "utils/replayHelpers";
import { updateAndSaveLayout } from "actions/pageActions";
import AnalyticsUtil from "../utils/AnalyticsUtil";
import { commentModeSelector } from "selectors/commentsSelectors";
import { snipingModeSelector } from "selectors/editorSelectors";
import { ReplayEntityType } from "entities/Replay/replayUtils";
import { updateAction } from "actions/pluginActionActions";
import { getEntityInCurrentPath } from "./RecentEntitiesSagas";
import { changeQuery } from "actions/queryPaneActions";
import { isAPIAction } from "./ActionSagas";
import { changeApi } from "actions/apiPaneActions";
import { updateJSCollection } from "actions/jsPaneActions";
import { changeDatasource } from "actions/datasourceActions";
import { workerComputeUndoRedo } from "./EvaluationsSaga";
import { createBrowserHistory } from "history";
import { getEditorConfig, getSettingConfig } from "selectors/entitiesSelector";
import { isArray } from "lodash";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

export type UndoRedoPayload = {
  operation: ReplayReduxActionTypes;
};

export default function* undoRedoListenerSaga() {
  yield takeEvery(ReduxActionTypes.UNDO_REDO_OPERATION, undoRedoSaga);
}

/**
 * This Saga is called if the type of update is a property change
 * @param replay
 * @returns
 */
export function* openPropertyPaneSaga(replay: any) {
  try {
    if (Object.keys(replay.widgets).length > 1) {
      yield put(selectWidgetAction(replay.widgets[0], false));
    }

    const replayWidgetId = Object.keys(replay.widgets)[0];

    if (!replayWidgetId || !replay.widgets[replayWidgetId].propertyUpdates)
      return;

    scrollWidgetIntoView(replayWidgetId);

    const isPropertyPaneVisible: boolean = yield select(
      getIsPropertyPaneVisible,
    );
    const selectedWidgetId: string = yield select(getCurrentWidgetId);

    //if property pane is not visible, select the widget and force open property pane
    if (selectedWidgetId !== replayWidgetId || !isPropertyPaneVisible) {
      yield put(selectWidgetAction(replayWidgetId, false));
      yield put(forceOpenPropertyPane(replayWidgetId));
    }

    flashElementsById(
      btoa(
        replay.widgets[replayWidgetId].propertyUpdates.slice(0, 2).join("."),
      ),
      0,
      1000,
      "#E0DEDE",
    );
  } catch (e) {
    log.error(e);
    Sentry.captureException(e);
  }
}

/**
 * This saga is called when type of chenge is not a property Change
 * @param replay
 * @returns
 */
export function* postUndoRedoSaga(replay: any) {
  try {
    const isPropertyPaneVisible: boolean = yield select(
      getIsPropertyPaneVisible,
    );

    if (isPropertyPaneVisible) yield put(closePropertyPane());

    // display toasts if it is a destructive operation
    if (replay.toasts && replay.toasts.length > 0) {
      processUndoRedoToasts(replay.toasts);
    }

    if (!replay.widgets || Object.keys(replay.widgets).length <= 0) return;

    const widgetIds = Object.keys(replay.widgets);

    if (widgetIds.length > 1) {
      yield put(selectMultipleWidgetsInitAction(widgetIds));
    } else {
      yield put(selectWidgetAction(widgetIds[0], false));
    }
    scrollWidgetIntoView(widgetIds[0]);
  } catch (e) {
    log.error(e);
    Sentry.captureException(e);
  }
}

/**
 * saga that listen for UNDO_REDO_OPERATION
 * it won't do anything in case of sniping/comment mode
 *
 * @param action
 * @returns
 */
export function* undoRedoSaga(action: ReduxAction<UndoRedoPayload>) {
  const isCommentMode: boolean = yield select(commentModeSelector);
  const isSnipingMode: boolean = yield select(snipingModeSelector);

  // if the app is in snipping or comments mode, don't do anything
  if (isCommentMode || isSnipingMode) return;
  try {
    const history = createBrowserHistory();
    const pathname = history.location.pathname;
    const { id, type } = getEntityInCurrentPath(pathname);
    const entityId = type === "page" ? "canvas" : id;
    const workerResponse: any = yield call(
      workerComputeUndoRedo,
      action.payload.operation,
      entityId,
    );

    // if there is no change, then don't do anythingÎ
    if (!workerResponse) return;

    const {
      event,
      logs,
      paths,
      replay,
      replayEntity,
      replayEntityType,
      timeTaken,
    } = workerResponse;

    logs && logs.forEach((evalLog: any) => log.debug(evalLog));

    switch (replayEntityType) {
      case ReplayEntityType.CANVAS: {
        const isPropertyUpdate = replay.widgets && replay.propertyUpdates;
        AnalyticsUtil.logEvent(event, { paths, timeTaken });
        if (isPropertyUpdate) yield call(openPropertyPaneSaga, replay);
        yield put(updateAndSaveLayout(replayEntity, false, false));
        if (!isPropertyUpdate) yield call(postUndoRedoSaga, replay);
        break;
      }
      case ReplayEntityType.ACTION:
        yield put(
          isAPIAction(replayEntity)
            ? changeApi(replayEntity.id, false, false, replayEntity)
            : changeQuery(replayEntity.id, false, replayEntity),
        );
        yield put(updateAction({ id: replayEntity.id, action: replayEntity }));
        yield take(ReduxActionTypes.UPDATE_ACTION_SUCCESS);
        yield call(replayPostProcess, replayEntity, replay, replayEntityType);
        break;
      case ReplayEntityType.DATASOURCE:
        yield put(
          changeDatasource({ datasource: replayEntity, isReplay: true }),
        );
        break;
      case ReplayEntityType.JSACTION:
        yield put(updateJSCollection(replayEntity.body, replayEntity.id));
        break;
    }
  } catch (e) {
    log.error(e);
    Sentry.captureException(e);
  }
}

export function* replayPostProcess(
  entity: any,
  replay: any,
  replayEntityType: ReplayEntityType,
) {
  yield call(displayChangeToast, entity, replay, replayEntityType);
}

export function* displayChangeToast(
  entity: any,
  replay: any,
  replayEntityType: ReplayEntityType,
) {
  const toasts = replay.toasts;
  if (!toasts || !toasts.length) return;
  const relevantToast =
    toasts.length > 1
      ? toasts.filter((toast: any) => toast.kind === "E")[0]
      : toasts[0];
  if (replayEntityType === ReplayEntityType.ACTION) {
    const pluginId = entity.pluginId;
    const editorConfig = yield select(getEditorConfig, pluginId);
    const settingsConfig = yield select(getSettingConfig, pluginId);
    const fieldLabel =
      findFieldLabelFactory(editorConfig, relevantToast.modifiedProperty) ||
      findFieldLabelFactory(settingsConfig, relevantToast.modifiedProperty);
    Toaster.show({
      text: fieldLabel,
      variant: Variant.success,
    });
  }
}

export function findFieldLabelFactory(config: any, field: string) {
  let result = "";
  if (!config || !isArray(config)) return result;
  for (const conf of config) {
    if (conf.configProperty === field) {
      result = conf.label || conf.internalLabel;
      break;
    } else if (conf.children) {
      result = findFieldLabelFactory(conf.children, field);
      if (result) break;
    }
  }
  return result;
}
