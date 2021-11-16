import {
  takeEvery,
  put,
  select,
  call,
  takeLatest,
  all,
  delay,
} from "redux-saga/effects";

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
  highlightReplayElement,
  switchTab,
  expandAccordion,
} from "utils/replayHelpers";
import { updateAndSaveLayout } from "actions/pageActions";
import AnalyticsUtil from "../utils/AnalyticsUtil";
import { commentModeSelector } from "selectors/commentsSelectors";
import { snipingModeSelector } from "selectors/editorSelectors";
import {
  findFieldInfo,
  getReplayEntityType,
  ReplayEntityType,
} from "entities/Replay/replayUtils";
import { updateAction } from "actions/pluginActionActions";
import { getEntityInCurrentPath } from "./RecentEntitiesSagas";
import { changeQuery } from "actions/queryPaneActions";
import { changeApi } from "actions/apiPaneActions";
import { updateJSCollectionBody } from "actions/jsPaneActions";
import { changeDatasource } from "actions/datasourceActions";
import {
  updateReplayEnitiySaga,
  workerComputeUndoRedo,
} from "./EvaluationsSaga";
import { createBrowserHistory } from "history";
import {
  getEditorConfig,
  getPluginForm,
  getSettingConfig,
} from "selectors/entitiesSelector";
import { isAPIAction, isQueryAction, isSaasAction } from "entities/Action";
import { API_EDITOR_TABS } from "constants/ApiEditorConstants";
import { EDITOR_TABS } from "constants/editorConstants";
import { isEmpty } from "lodash";

export type UndoRedoPayload = {
  operation: ReplayReduxActionTypes;
};

export default function* undoRedoListenerSaga() {
  yield all([
    takeEvery(ReduxActionTypes.UNDO_REDO_OPERATION, undoRedoSaga),
    takeLatest(ReduxActionTypes.UPDATE_REPLAY_ENTITY, updateReplayEnitiySaga),
  ]);
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
      timeTaken,
    } = workerResponse;

    logs && logs.forEach((evalLog: any) => log.debug(evalLog));
    const replayEntityType = getReplayEntityType(replayEntity);
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
        yield replayActionSaga(replayEntity, replay);
        break;
      case ReplayEntityType.DATASOURCE: {
        yield replayDatasourceSaga(replayEntity, replay);
        break;
      }
      case ReplayEntityType.JSACTION:
        yield put(updateJSCollectionBody(replayEntity.body, replayEntity.id));
        break;
    }
  } catch (e) {
    log.error(e);
    Sentry.captureException(e);
  }
}

export function* replayPreProcess(
  replayEntity: any,
  replay: any,
  replayEntityType: ReplayEntityType,
) {
  let res = {};
  const { updates = [] } = replay;
  if (updates.length > 1) return res;
  const { modifiedProperty } = updates[0] || {};
  if (!modifiedProperty) return res;
  if (replayEntityType === ReplayEntityType.ACTION) {
    res = yield call(getEditorFieldConfig, replayEntity, modifiedProperty);
  } else if (replayEntityType === ReplayEntityType.DATASOURCE) {
    res = yield call(getDatasourceFieldConfig, replayEntity, modifiedProperty);
  }
  return { ...res, modifiedProperty };
}

function* getDatasourceFieldConfig(
  replayEntity: any,
  modifiedProperty: string,
) {
  const formConfig: [Record<any, any>] = yield select(
    getPluginForm,
    replayEntity.pluginId,
  );
  const fieldInfo = findFieldInfo(formConfig, modifiedProperty);
  return { fieldInfo };
}

function* getEditorFieldConfig(replayEntity: any, modifiedProperty: string) {
  let currentTab = "";
  let fieldInfo = {};
  if (isAPIAction(replayEntity)) {
    if (modifiedProperty.indexOf("headers") > -1)
      currentTab = API_EDITOR_TABS.HEADERS;
    else if (modifiedProperty.indexOf("queryParameters") > -1)
      currentTab = API_EDITOR_TABS.PARAMS;
    else if (modifiedProperty.indexOf("body") > -1)
      currentTab = API_EDITOR_TABS.BODY;
    else if (modifiedProperty.indexOf("pagination") > -1)
      currentTab = API_EDITOR_TABS.PAGINATION;
    if (!currentTab) {
      const settingsConfig: [Record<any, any>] = yield select(
        getSettingConfig,
        replayEntity.pluginId,
      );
      fieldInfo = findFieldInfo(settingsConfig, modifiedProperty);
      if (!isEmpty(fieldInfo)) currentTab = API_EDITOR_TABS.SETTINGS;
    }
  } else {
    const editorConfig: [Record<any, any>] = yield select(
      getEditorConfig,
      replayEntity.pluginId,
    );
    fieldInfo = findFieldInfo(editorConfig, modifiedProperty);
    if (!isEmpty(fieldInfo)) {
      currentTab = EDITOR_TABS.QUERY;
    } else {
      const settingsConfig: [Record<any, any>] = yield select(
        getSettingConfig,
        replayEntity.pluginId,
      );
      fieldInfo = findFieldInfo(settingsConfig, modifiedProperty);
      if (!isEmpty(fieldInfo)) currentTab = EDITOR_TABS.SETTINGS;
    }
  }
  return { currentTab, fieldInfo };
}

function* replayActionSaga(replayEntity: any, replay: any) {
  const { currentTab, modifiedProperty } = yield call(
    replayPreProcess,
    replayEntity,
    replay,
    ReplayEntityType.ACTION,
  );
  yield call(switchTab, currentTab);
  yield delay(100);
  if (isQueryAction(replayEntity)) {
    yield put(changeQuery(replayEntity.id, false, replayEntity));
  } else {
    yield put(
      changeApi(
        replayEntity.id,
        isSaasAction(replayEntity),
        false,
        replayEntity,
      ),
    );
  }
  highlightReplayElement(modifiedProperty);
  yield put(updateAction({ id: replayEntity.id, action: replayEntity }));
}

function* replayDatasourceSaga(replayEntity: any, replay: any) {
  const { fieldInfo, modifiedProperty } = yield call(
    replayPreProcess,
    replayEntity,
    replay,
    ReplayEntityType.DATASOURCE,
  );
  const { parentSection = "" } = fieldInfo;
  yield call(expandAccordion, parentSection);
  yield delay(100);
  yield put(changeDatasource({ datasource: replayEntity, isReplay: true }));
  highlightReplayElement(modifiedProperty);
}
