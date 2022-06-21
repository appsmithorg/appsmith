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
import { FlattenedWidgetProps } from "widgets/constants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

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

  const widget: FlattenedWidgetProps | undefined = yield select(
    getWidgetByName,
    widgetName,
  );
  if (!widget) {
    throw new TriggerFailureError(`Widget ${payload.widgetName} not found`);
  }

  yield put(resetWidgetMetaProperty(widget.widgetId, payload));
  if (payload.resetChildren) {
    yield put(resetChildrenMetaProperty(widget.widgetId));
  }

  /* It is possible that user calls multiple storeValue function together, in such case we need to track completion of each action separately
  We use uniqueActionRequestId to differentiate each storeValueAction here.
  */
  while (true) {
    const returnedAction: ResetWidgetDescription | undefined = yield take(
      ReduxActionTypes.RESET_WIDGET_META_EVALUATED,
    );
    if (
      !returnedAction?.payload ||
      !returnedAction?.payload?.uniqueActionRequestId
    ) {
      break;
    }

    const { uniqueActionRequestId } = returnedAction.payload;
    if (uniqueActionRequestId === payload.uniqueActionRequestId) {
      break;
    }
  }

  AppsmithConsole.info({
    text: `resetWidget('${payload.widgetName}', ${payload.resetChildren}) was triggered`,
  });
}
