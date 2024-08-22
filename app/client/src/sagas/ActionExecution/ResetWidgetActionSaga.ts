import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { resetWidgetMetaUpdates } from "actions/metaActions";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { put, select, take } from "redux-saga/effects";
import {
  ActionValidationError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import { getWidgetByName } from "sagas/selectors";
import AppsmithConsole from "utils/AppsmithConsole";
import { Types, getType } from "utils/TypeHelpers";
import type { TResetWidgetDescription } from "workers/Evaluation/fns/resetWidget";

export default function* resetWidgetActionSaga(
  action: TResetWidgetDescription,
) {
  const { payload } = action;
  const { metaUpdates, widgetName } = payload;

  if (getType(widgetName) !== Types.STRING) {
    throw new ActionValidationError(
      "RESET_WIDGET_META_RECURSIVE_BY_NAME",
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

  yield put(resetWidgetMetaUpdates(metaUpdates));

  yield take(ReduxActionTypes.RESET_WIDGET_META_EVALUATED);
  AppsmithConsole.info({
    text: `resetWidget('${payload.widgetName}', ${payload.resetChildren}) was triggered`,
  });
}
