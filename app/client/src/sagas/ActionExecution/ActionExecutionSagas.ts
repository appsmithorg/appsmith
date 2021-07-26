import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  ExecuteActionPayload,
  ExecuteActionPayloadEvent,
} from "constants/AppsmithActionConstants/ActionConstants";
import * as log from "loglevel";
import { all, call, put, takeEvery } from "redux-saga/effects";
import { evaluateDynamicTrigger } from "sagas/EvaluationsSaga";
import AppsmithConsole from "utils/AppsmithConsole";
import navigateActionSaga from "sagas/ActionExecution/NavigateActionSaga";
import storeValueLocally from "sagas/ActionExecution/StoreActionSaga";
import downloadSaga from "sagas/ActionExecution/DownloadActionSaga";
import copySaga from "sagas/ActionExecution/CopyActionSaga";
import resetWidgetActionSaga from "sagas/ActionExecution/ResetWidgetActionSaga";
import showAlertSaga from "sagas/ActionExecution/ShowAlertActionSaga";
import executeActionSaga from "sagas/ActionExecution/PluginActionSaga";
import executePromiseSaga from "sagas/ActionExecution/PromiseActionSaga";
import {
  ActionDescription,
  ActionTriggerType,
} from "entities/DataTree/actionTriggers";

function* executeActionTriggers(
  trigger: ActionDescription,
  event: ExecuteActionPayloadEvent,
) {
  try {
    switch (trigger.type) {
      case ActionTriggerType.PROMISE:
        yield call(executePromiseSaga, trigger.payload, event);
        break;
      case ActionTriggerType.PLUGIN_ACTION:
        yield call(executeActionSaga, trigger.payload, event);
        break;
      case ActionTriggerType.NAVIGATE_TO:
        yield call(navigateActionSaga, trigger.payload, event);
        break;
      case ActionTriggerType.SHOW_ALERT:
        yield call(showAlertSaga, trigger.payload, event);
        break;
      case ActionTriggerType.SHOW_MODAL_BY_NAME:
        yield put(trigger);
        if (event.callback) event.callback({ success: true });
        break;
      case ActionTriggerType.CLOSE_MODAL:
        yield put(trigger);
        AppsmithConsole.info({
          text: `closeModal(${trigger.payload.modalName}) was triggered`,
        });
        if (event.callback) event.callback({ success: true });
        break;
      case ActionTriggerType.STORE_VALUE:
        yield call(storeValueLocally, trigger.payload, event);
        break;
      case ActionTriggerType.DOWNLOAD:
        yield call(downloadSaga, trigger.payload, event);
        break;
      case ActionTriggerType.COPY_TO_CLIPBOARD:
        yield call(copySaga, trigger.payload, event);
        break;
      case ActionTriggerType.RESET_WIDGET_META_RECURSIVE_BY_NAME:
        yield call(resetWidgetActionSaga, trigger.payload, event);
        break;
      default:
        log.error("Trigger type unknown", trigger);
        if (event.callback) event.callback({ success: false });
    }
  } catch (e) {
    if (event.callback) event.callback({ success: false });
  }
}

function* executeAppAction(action: ReduxAction<ExecuteActionPayload>) {
  const { dynamicString, event, responseData } = action.payload;
  log.debug({ dynamicString, responseData });

  if (dynamicString === undefined) {
    if (event.callback) event.callback({ success: false });
    log.error("Executing undefined action", event);
    return;
  }

  const triggers = yield call(
    evaluateDynamicTrigger,
    dynamicString,
    responseData,
  );

  log.debug({ triggers });
  if (triggers && triggers.length) {
    yield all(
      triggers.map((trigger: ActionDescription) =>
        call(executeActionTriggers, trigger, event),
      ),
    );
  } else {
    if (event.callback) event.callback({ success: true });
  }
}

export function* watchActionExecutionSagas() {
  yield all([takeEvery(ReduxActionTypes.EXECUTE_ACTION, executeAppAction)]);
}
