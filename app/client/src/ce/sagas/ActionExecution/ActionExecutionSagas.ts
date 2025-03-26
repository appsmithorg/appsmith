import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  EventType,
  ExecuteTriggerPayload,
  TriggerSource,
} from "constants/AppsmithActionConstants/ActionConstants";
import { TriggerKind } from "constants/AppsmithActionConstants/ActionConstants";
import log from "loglevel";
import {
  all,
  call,
  put,
  takeEvery,
  takeLatest,
  select,
} from "redux-saga/effects";
import {
  evaluateActionSelectorFieldSaga,
  evaluateAndExecuteDynamicTrigger,
  setAppVersionOnWorkerSaga,
} from "sagas/EvaluationsSaga";
import navigateActionSaga from "sagas/ActionExecution/NavigateActionSaga";
import downloadSaga from "sagas/ActionExecution/DownloadActionSaga";
import copySaga from "sagas/ActionExecution/CopyActionSaga";
import resetWidgetActionSaga from "sagas/ActionExecution/ResetWidgetActionSaga";
import showAlertSaga from "sagas/ActionExecution/ShowAlertActionSaga";
import executePluginActionTriggerSaga from "sagas/ActionExecution/PluginActionSaga";
import {
  clearActionResponse,
  updateActionData,
} from "actions/pluginActionActions";
import {
  closeModalSaga,
  openModalSaga,
} from "sagas/ActionExecution/ModalSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  getCurrentLocationSaga,
  stopWatchCurrentLocation,
  watchCurrentLocation,
} from "sagas/ActionExecution/geolocationSaga";
import { postMessageSaga } from "sagas/ActionExecution/PostMessageSaga";
import type { ActionDescription } from "ee/workers/Evaluation/fns";
import type { AppState } from "ee/reducers";
import { getAction } from "ee/selectors/entitiesSelector";
import { getSourceFromTriggerMeta } from "ee/entities/AppsmithConsole/utils";
import { logoutSaga } from "../userSagas";

export interface TriggerMeta {
  source?: TriggerSource;
  triggerPropertyName?: string;
  triggerKind?: TriggerKind;
  onPageLoad: boolean;
}

/**
 * The controller saga that routes different trigger effects to its executor sagas
 * @param trigger The trigger information with trigger type
 * @param eventType Widget/Platform event which triggered this action
 * @param triggerMeta Where the trigger originated from
 */
export function* executeActionTriggers(
  trigger: ActionDescription,
  eventType: EventType,
  triggerMeta: TriggerMeta,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // when called via a promise, a trigger can return some value to be used in .then
  let response: unknown[] = [];
  const source = getSourceFromTriggerMeta(triggerMeta);

  switch (trigger.type) {
    case "RUN_PLUGIN_ACTION":
      response = yield call(executePluginActionTriggerSaga, trigger, eventType);
      break;
    case "CLEAR_PLUGIN_ACTION":
      yield put(clearActionResponse(trigger.payload.actionId));
      const action: ReturnType<typeof getAction> = yield select(
        (state: AppState) => getAction(state, trigger.payload.actionId),
      );

      if (action) {
        yield put(
          updateActionData([
            {
              entityName: action.name,
              dataPath: "data",
              data: undefined,
            },
          ]),
        );
      }

      break;
    case "NAVIGATE_TO":
      yield call(navigateActionSaga, trigger, source);
      break;
    case "SHOW_ALERT":
      yield call(showAlertSaga, trigger, source);
      break;
    case "SHOW_MODAL_BY_NAME":
      yield call(openModalSaga, trigger, source);
      break;
    case "CLOSE_MODAL":
      yield call(closeModalSaga, trigger, source);
      break;
    case "DOWNLOAD":
      yield call(downloadSaga, trigger, source);
      break;
    case "COPY_TO_CLIPBOARD":
      yield call(copySaga, trigger, source);
      break;
    case "RESET_WIDGET_META_RECURSIVE_BY_NAME":
      yield call(resetWidgetActionSaga, trigger, source);
      break;
    case "GET_CURRENT_LOCATION":
      response = yield call(getCurrentLocationSaga, trigger);
      break;
    case "WATCH_CURRENT_LOCATION":
      response = yield call(
        watchCurrentLocation,
        trigger,
        eventType,
        triggerMeta,
      );
      break;
    case "STOP_WATCHING_CURRENT_LOCATION":
      response = yield call(stopWatchCurrentLocation);
      break;
    case "POST_MESSAGE":
      yield call(postMessageSaga, trigger);
      break;
    case "LOGOUT_USER_INIT":
      yield call(logoutSaga, trigger);
      break;
    default:
      log.error("Trigger type unknown", trigger, source);
      throw Error("Trigger type unknown");
  }

  return response;
}

export function* executeAppAction(payload: ExecuteTriggerPayload): Generator {
  const {
    callbackData,
    dynamicString,
    event: { type },
    globalContext,
    source,
    triggerPropertyName,
  } = payload;

  log.debug({ dynamicString, callbackData, globalContext });

  if (dynamicString === undefined) {
    throw new Error("Executing undefined action");
  }

  return yield call(
    evaluateAndExecuteDynamicTrigger,
    dynamicString,
    type,
    {
      source,
      triggerPropertyName,
      triggerKind: TriggerKind.EVENT_EXECUTION,
      onPageLoad: false,
    },
    callbackData,
    globalContext,
  );
}

function* initiateActionTriggerExecution(
  action: ReduxAction<ExecuteTriggerPayload>,
) {
  const { event, source, triggerPropertyName } = action.payload;

  // Clear all error for this action trigger. In case the error still exists,
  // it will be created again while execution
  AppsmithConsole.deleteErrors([
    { id: `${source?.id}-${triggerPropertyName}` },
  ]);
  try {
    yield call(executeAppAction, action.payload);

    if (event.callback) {
      event.callback({ success: true });
    }
  } catch (e) {
    if (event.callback) {
      event.callback({ success: false });
    }

    log.error(e);
  }
}

export function* watchActionExecutionSagas() {
  yield all([
    takeEvery(
      ReduxActionTypes.EXECUTE_TRIGGER_REQUEST,
      initiateActionTriggerExecution,
    ),
    takeLatest(
      ReduxActionTypes.SET_APP_VERSION_ON_WORKER,
      setAppVersionOnWorkerSaga,
    ),
    takeLatest(
      ReduxActionTypes.EVALUATE_ACTION_SELECTOR_FIELD,
      evaluateActionSelectorFieldSaga,
    ),
  ]);
}
