import { put, select, take } from "redux-saga/effects";
import { getWidgetByName } from "sagas/selectors";
import {
  focusInputChildrenMetaProperty,
  focusInputWidgetMetaProperty,
} from "actions/metaActions";
import AppsmithConsole from "utils/AppsmithConsole";
import {
  ActionTriggerType,
  FocusInputWidgetDescription,
} from "entities/DataTree/actionTriggers";
import {
  ActionValidationError,
  TriggerFailureError,
} from "sagas/ActionExecution/errorUtils";
import { getType, Types } from "utils/TypeHelpers";
import { FlattenedWidgetProps } from "widgets/constants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getDataTree } from "selectors/dataTreeSelectors";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { isWidget } from "workers/Evaluation/evaluationUtils";

export default function* focusInputWidgetActionSaga(
  payload: FocusInputWidgetDescription["payload"],
) {
  const { widgetName } = payload;
  if (getType(widgetName) !== Types.STRING) {
    throw new ActionValidationError(
      ActionTriggerType.FOCUS_INPUT_WIDGET_META_RECURSIVE_BY_NAME,
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
  const evaluatedEntity = dataTree[widget.widgetName];
  if (isWidget(evaluatedEntity)) {
    yield put(focusInputWidgetMetaProperty(widget.widgetId, evaluatedEntity));
    if (payload.resetChildren) {
      yield put(focusInputChildrenMetaProperty(widget.widgetId));
    }
  }

  yield take(ReduxActionTypes.FOCUS_INPUT_WIDGET_META_EVALUATED);

  AppsmithConsole.info({
    text: `focusWidget('${payload.widgetName}', ${payload.resetChildren}) was triggered`,
  });
}
