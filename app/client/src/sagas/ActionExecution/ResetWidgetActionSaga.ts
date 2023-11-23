import { call, put, select, take } from "redux-saga/effects";
import { getWidgetByName } from "sagas/selectors";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  ActionValidationError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { isWidget } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { TResetWidgetDescription } from "workers/Evaluation/fns/resetWidget";
import { getWidgetDescendantsForReset } from "sagas/WidgetOperationSagas";
import type { DescendantWidgetMap } from "sagas/WidgetOperationUtils";
import { getDataTree } from "selectors/dataTreeSelectors";
import type { DataTree } from "entities/DataTree/dataTreeTypes";

export default function* resetWidgetActionSaga(
  action: TResetWidgetDescription,
) {
  const { payload } = action;
  const { widgetName } = payload;
  if (getType(widgetName) !== Types.STRING) {
    throw new ActionValidationError(
      "RESET_WIDGET_META_RECURSIVE_BY_NAME",
      "widgetName",
      Types.STRING,
      getType(widgetName),
    );
  }
  const dataTree: DataTree = yield select(getDataTree);

  const widget: FlattenedWidgetProps | undefined = yield select(
    getWidgetByName,
    widgetName,
  );
  if (!widget) {
    throw new TriggerFailureError(`Widget ${payload.widgetName} not found`);
  }
  const evaluatedWidget = dataTree[widgetName];

  if (!evaluatedWidget || !isWidget(evaluatedWidget)) {
    throw new TriggerFailureError(`Widget ${payload.widgetName} not found`);
  }

  const widgetsToReset = new Set([widgetName]);

  if (payload.resetChildren) {
    const allWidgetDescendants: DescendantWidgetMap[] = yield call(
      getWidgetDescendantsForReset,
      widget.widgetId,
    );
    for (const descendant of allWidgetDescendants) {
      const widgetName = descendant.evaluatedWidget?.widgetName;
      if (!widgetName) continue;
      widgetsToReset.add(widgetName);
    }
  }
  yield put({
    type: ReduxActionTypes.RESET_WIDGETS,
    payload: Array.from(widgetsToReset),
  });

  yield take(ReduxActionTypes.SET_EVALUATED_TREE);

  AppsmithConsole.info({
    text: `resetWidget('${payload.widgetName}', ${payload.resetChildren}) was triggered`,
  });
}
