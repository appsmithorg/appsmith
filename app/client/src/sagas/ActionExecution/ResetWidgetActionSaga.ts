import { put, select, take } from "redux-saga/effects";
import { getWidgetByName } from "sagas/selectors";
import {
  resetChildrenMetaProperty,
  resetWidgetMetaProperty,
} from "actions/metaActions";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  ActionTriggerType,
  ResetWidgetDescription,
} from "entities/DataTree/actionTriggers";
import {
  ActionValidationError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

export default function* resetWidgetActionSaga(
  payload: ResetWidgetDescription["payload"],
) {
  const { widgetName } = payload;
  if (getType(widgetName) !== Types.STRING) {
    throw new ActionValidationError(
      ActionTriggerType.RESET_WIDGET_META_RECURSIVE_BY_NAME,
      "widgetName",
      Types.STRING,
      getType(widgetName),
    );
  }

  const widget = yield select(getWidgetByName, widgetName);
  if (!widget) {
    throw new TriggerFailureError(`Widget ${payload.widgetName} not found`);
  }

  yield put(resetWidgetMetaProperty(widget.widgetId));
  if (payload.resetChildren) {
    yield put(resetChildrenMetaProperty(widget.widgetId));
  }

  yield take(ReduxActionTypes.RESET_WIDGET_META_EVALUATED);

  AppsmithConsole.info({
    text: `resetWidget('${payload.widgetName}', ${payload.resetChildren}) was triggered`,
  });
}
