import { put, select, take } from "redux-saga/effects";
import { getWidgetByName } from "sagas/selectors";
import { resetWidgetMetaUpdates } from "actions/metaActions";

import {
  ActionValidationError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";
import type { FlattenedWidgetProps } from "WidgetProvider/types";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { TResetWidgetDescription } from "workers/Evaluation/fns/resetWidget";
import AppsmithConsole from "utils/AppsmithConsole";
import type { SourceEntity } from "entities/AppsmithConsole";

export default function* resetWidgetActionSaga(
  action: TResetWidgetDescription,
  source?: SourceEntity,
) {
  const { payload } = action;
  const { metaUpdates, resetChildren, widgetName } = payload;

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
    source,
    text: `resetWidget triggered`,
    state: {
      widgetName,
      resetChildren,
    },
  });
}
