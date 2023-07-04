import { put, select, take } from "redux-saga/effects";
import { getWidgetByName } from "sagas/selectors";
import {
  resetChildrenMetaProperty,
  resetWidgetMetaProperty,
} from "actions/metaActions";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  ActionValidationError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";
import type { FlattenedWidgetProps } from "widgets/constants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getDataTree, getConfigTree } from "selectors/dataTreeSelectors";
import type {
  DataTree,
  ConfigTree,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import { isWidget } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { TResetWidgetDescription } from "workers/Evaluation/fns/resetWidget";

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
  const configTree: ConfigTree = yield select(getConfigTree);

  const widget: FlattenedWidgetProps | undefined = yield select(
    getWidgetByName,
    widgetName,
  );
  if (!widget) {
    throw new TriggerFailureError(`Widget ${payload.widgetName} not found`);
  }
  const evaluatedEntity = dataTree[widget.widgetName];
  const evaluatedEntityConfig = configTree[widget.widgetName];
  if (isWidget(evaluatedEntity)) {
    yield put(
      resetWidgetMetaProperty(
        widget.widgetId,
        evaluatedEntity,
        evaluatedEntityConfig as WidgetEntityConfig,
      ),
    );
    if (payload.resetChildren) {
      yield put(resetChildrenMetaProperty(widget.widgetId));
    }
  }

  yield take(ReduxActionTypes.RESET_WIDGET_META_EVALUATED);

  AppsmithConsole.info({
    text: `resetWidget('${payload.widgetName}', ${payload.resetChildren}) was triggered`,
  });
}
