import { put, select } from "redux-saga/effects";
import { getWidgetByName } from "sagas/selectors";
import {
  resetChildrenMetaProperty,
  resetWidgetMetaProperty,
} from "actions/metaActions";
import AppsmithConsole from "utils/AppsmithConsole";
import { ResetWidgetDescription } from "entities/DataTree/actionTriggers";
import { TriggerMeta } from "sagas/ActionExecution/ActionExecutionSagas";
import { TriggerFailureError } from "sagas/ActionExecution/errorUtils";

export default function* resetWidgetActionSaga(
  payload: ResetWidgetDescription["payload"],
  triggerMeta: TriggerMeta,
) {
  if (typeof payload.widgetName !== "string") {
    throw new TriggerFailureError(
      "widgetName needs to be a string",
      triggerMeta,
    );
  }

  const widget = yield select(getWidgetByName, payload.widgetName);
  if (!widget) {
    throw new TriggerFailureError(
      `widget ${payload.widgetName} not found`,
      triggerMeta,
    );
  }

  yield put(resetWidgetMetaProperty(widget.widgetId));
  if (payload.resetChildren) {
    yield put(resetChildrenMetaProperty(widget.widgetId));
  }

  AppsmithConsole.info({
    text: `resetWidget('${payload.widgetName}', ${payload.resetChildren}) was triggered`,
  });
}
