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
import { closePropertyPane } from "actions/widgetActions";
import {
  selectMultipleWidgetsInitAction,
  selectWidgetAction,
} from "actions/widgetSelectionActions";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxFormActionTypes,
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
import { findFieldInfo, REPLAY_FOCUS_DELAY } from "entities/Replay/replayUtils";
import { setActionProperty, updateAction } from "actions/pluginActionActions";
import { getEntityInCurrentPath } from "./RecentEntitiesSagas";
import { changeQuery } from "actions/queryPaneActions";
import { changeApi } from "actions/apiPaneActions";
import { updateJSCollectionBody } from "actions/jsPaneActions";
import { changeDatasource } from "actions/datasourceActions";
import {
  updateReplayEntitySaga,
  workerComputeUndoRedo,
} from "./EvaluationsSaga";
import { createBrowserHistory } from "history";
import {
  getEditorConfig,
  getPluginForm,
  getSettingConfig,
} from "selectors/entitiesSelector";
import {
  Action,
  isAPIAction,
  isQueryAction,
  isSaasAction,
} from "entities/Action";
import { API_EDITOR_TABS } from "constants/ApiEditorConstants";
import { EDITOR_TABS } from "constants/QueryEditorConstants";
import _, { isEmpty } from "lodash";
import { updateFormFields } from "./ApiPaneSagas";
import { ReplayEditorUpdate } from "entities/Replay/ReplayEntity/ReplayEditor";
import { Datasource } from "entities/Datasource";
import { ENTITY_TYPE } from "entities/AppsmithConsole";

export type UndoRedoPayload = {
  operation: ReplayReduxActionTypes;
};

export default function* undoRedoListenerSaga() {
  yield all([
    takeEvery(ReduxActionTypes.UNDO_REDO_OPERATION, undoRedoSaga),
    takeLatest(ReduxActionTypes.UPDATE_REPLAY_ENTITY, updateReplayEntitySaga),
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
    const workerResponse = yield call(
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
      case ENTITY_TYPE.WIDGET: {
        const isPropertyUpdate = replay.widgets && replay.propertyUpdates;
        AnalyticsUtil.logEvent(event, { paths, timeTaken });
        if (isPropertyUpdate) yield call(openPropertyPaneSaga, replay);
        yield put(updateAndSaveLayout(replayEntity, false, false));
        if (!isPropertyUpdate) yield call(postUndoRedoSaga, replay);
        break;
      }
      case ENTITY_TYPE.ACTION:
        yield call(replayActionSaga, replayEntity, replay);
        break;
      case ENTITY_TYPE.DATASOURCE: {
        yield call(replayDatasourceSaga, replayEntity, replay);
        break;
      }
      case ENTITY_TYPE.JSACTION:
        yield put(
          updateJSCollectionBody(replayEntity.body, replayEntity.id, true),
        );
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
  replayEntityType: ENTITY_TYPE,
) {
  let res = {};
  const { updates = [] } = replay;
  const { kind = "", modifiedProperty } = updates[updates.length - 1] || {};
  if (!modifiedProperty) return res;
  if (replayEntityType === ENTITY_TYPE.ACTION) {
    res = yield call(getEditorFieldConfig, replayEntity, modifiedProperty);
  } else if (replayEntityType === ENTITY_TYPE.DATASOURCE) {
    res = yield call(getDatasourceFieldConfig, replayEntity, modifiedProperty);
  }
  return { ...res, kind, modifiedProperty };
}

/*
  Figure out the field config of the last modified field in datasource forms
*/
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

/*
  Figure out the tab in which the last modified field is present and the 
  field config of the last modified field.
*/
function* getEditorFieldConfig(replayEntity: Action, modifiedProperty: string) {
  let currentTab = "";
  let fieldInfo = {};
  if (!modifiedProperty) return { currentTab, fieldInfo };
  if (isAPIAction(replayEntity)) {
    if (modifiedProperty.includes("headers"))
      currentTab = API_EDITOR_TABS.HEADERS;
    else if (modifiedProperty.includes("queryParameters"))
      currentTab = API_EDITOR_TABS.PARAMS;
    else if (modifiedProperty.includes("body"))
      currentTab = API_EDITOR_TABS.BODY;
    else if (
      modifiedProperty.includes("pagination") ||
      modifiedProperty.includes("next") ||
      modifiedProperty.includes("previous")
    )
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
  const { updates = [] } = replay;
  const { modifiedProperty } = updates[updates.length - 1] || {};
  const { currentTab } = yield call(
    getEditorFieldConfig,
    replayEntity,
    modifiedProperty,
  );
  const didSwitch: boolean = yield call(switchTab, currentTab);
  //Delay change if tab needs to be switched
  if (didSwitch) yield delay(REPLAY_FOCUS_DELAY);
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
    yield call(updateFormFields, {
      meta: { field: modifiedProperty },
      type: ReduxFormActionTypes.VALUE_CHANGE,
      payload: _.get(replayEntity, modifiedProperty),
    });
  }
  highlightReplayElement(
    updates.map((u: ReplayEditorUpdate<Action>) => u.modifiedProperty),
  );
  yield put(
    setActionProperty({
      actionId: replayEntity.id,
      propertyName: modifiedProperty,
      value: _.get(replayEntity, modifiedProperty),
      skipSave: true,
    }),
  );
  yield put(updateAction({ id: replayEntity.id, action: replayEntity }));
}

function* replayDatasourceSaga(replayEntity: any, replay: any) {
  const { updates = [] } = replay;
  const { modifiedProperty } = updates[updates.length - 1] || {};
  const { fieldInfo } = yield call(
    getDatasourceFieldConfig,
    replayEntity,
    modifiedProperty,
  );
  const { parentSection = "" } = fieldInfo;
  const didExpand: boolean = yield call(expandAccordion, parentSection);
  //Delay change if accordion needs to be expanded
  if (didExpand) yield delay(REPLAY_FOCUS_DELAY);
  yield put(changeDatasource({ datasource: replayEntity, isReplay: true }));
  highlightReplayElement(
    updates.map((u: ReplayEditorUpdate<Datasource>) => u.modifiedProperty),
  );
}
