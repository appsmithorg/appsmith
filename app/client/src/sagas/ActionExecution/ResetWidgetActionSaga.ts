import { call, put, select, take } from "redux-saga/effects";
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
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  getDataTree,
  getConfigTree,
  getUnevaluatedDataTree,
} from "selectors/dataTreeSelectors";
import type {
  DataTree,
  ConfigTree,
  WidgetEntityConfig,
  UnEvalTree,
  UnEvalTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import { isWidget } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { TResetWidgetDescription } from "workers/Evaluation/fns/resetWidget";
import type { PropertyOverrideDependency } from "entities/DataTree/types";
import { evalWorker } from "sagas/EvaluationsSaga";
import { EVAL_WORKER_ACTIONS } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { getCodeFromMoustache } from "components/editorComponents/ActionCreator/utils";
import { klona } from "klona";

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
  const unEvalAndConfigTree: ReturnType<typeof getUnevaluatedDataTree> =
    yield select(getUnevaluatedDataTree);

  const widget: FlattenedWidgetProps | undefined = yield select(
    getWidgetByName,
    widgetName,
  );
  if (!widget) {
    throw new TriggerFailureError(`Widget ${payload.widgetName} not found`);
  }
  const evaluatedEntity = dataTree[widget.widgetName];
  const evaluatedEntityConfig = configTree[
    widget.widgetName
  ] as WidgetEntityConfig;

  const unEvalEntity = unEvalAndConfigTree.unEvalTree[
    widget.widgetName
  ] as UnEvalTree;

  if (isWidget(evaluatedEntity)) {
    const evaluatedEntityClone = klona(evaluatedEntity);

    if (evaluatedEntity) {
      const { propertyOverrideDependency } = evaluatedEntityConfig;
      // propertyOverrideDependency has defaultProperty name for each meta property of widget
      const propertyOverrideDependencyEntries = Object.entries(
        propertyOverrideDependency as PropertyOverrideDependency,
      );

      for (let i = 0; i < propertyOverrideDependencyEntries.length; i++) {
        const [, dependency] = propertyOverrideDependencyEntries[i];
        const defaultPropertyPath = dependency.DEFAULT;

        if (!defaultPropertyPath) continue;

        const expressionToEvaluate: string | UnEvalTreeEntity | undefined =
          defaultPropertyPath && unEvalEntity[defaultPropertyPath];

        let finalValue: unknown;
        if (
          expressionToEvaluate &&
          typeof expressionToEvaluate === "string" &&
          isDynamicValue(expressionToEvaluate)
        ) {
          const codeFromMoustache = getCodeFromMoustache(expressionToEvaluate);
          const workerResponse: {
            errors: Array<unknown>;
            result: unknown;
          } = yield call(
            evalWorker.request,
            EVAL_WORKER_ACTIONS.EVAL_EXPRESSION,
            {
              expression: codeFromMoustache,
            },
          );
          finalValue = workerResponse.result;
        } else {
          finalValue = expressionToEvaluate;
        }

        evaluatedEntityClone[defaultPropertyPath] = finalValue;
      }
    }

    yield put(
      resetWidgetMetaProperty(
        widget.widgetId,
        evaluatedEntityClone,
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
