import { ExecuteActionPayloadEvent } from "constants/AppsmithActionConstants/ActionConstants";
import { put, select } from "redux-saga/effects";
import { getWidgetByName } from "sagas/selectors";
import {
  resetChildrenMetaProperty,
  resetWidgetMetaProperty,
} from "actions/metaActions";
import AppsmithConsole from "utils/AppsmithConsole";
import { ResetWidgetDescription } from "entities/DataTree/actionTriggers";

export default function* resetWidgetActionSaga(
  payload: ResetWidgetDescription["payload"],
  event: ExecuteActionPayloadEvent,
) {
  const fail = (msg: string) => {
    console.error(msg);
    if (event.callback) event.callback({ success: false });
  };
  if (typeof payload.widgetName !== "string") {
    return fail("widgetName needs to be a string");
  }

  const widget = yield select(getWidgetByName, payload.widgetName);
  if (!widget) {
    return fail(`widget ${payload.widgetName} not found`);
  }

  yield put(resetWidgetMetaProperty(widget.widgetId));
  if (payload.resetChildren) {
    yield put(resetChildrenMetaProperty(widget.widgetId));
  }

  AppsmithConsole.info({
    text: `resetWidget('${payload.widgetName}', ${payload.resetChildren}) was triggered`,
  });

  if (event.callback) event.callback({ success: true });
}
