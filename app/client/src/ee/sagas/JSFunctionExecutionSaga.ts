export * from "ce/sagas/JSFunctionExecutionSaga";

import { logActionExecutionForAudit } from "actions/jsActionActions";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { call, put, select } from "redux-saga/effects";
import { getCurrentPageName } from "selectors/editorSelectors";
import {
  getJSCollectionFromName,
  getJSActionFromJSCollection,
} from "@appsmith/selectors/entitiesSelector";
import type { TMessage } from "utils/MessageUtil";
import { get, set, uniq } from "lodash";
import { TriggerKind } from "constants/AppsmithActionConstants/ActionConstants";
import type { TriggerSource } from "constants/AppsmithActionConstants/ActionConstants";
import { logJSActionExecution } from "@appsmith/sagas/analyticsSaga";

export function* logJSFunctionExecution(
  message: TMessage<{
    data: {
      jsFnFullName: string;
      isSuccess: boolean;
      triggerMeta: {
        source: TriggerSource;
        triggerPropertyName: string | undefined;
        triggerKind: TriggerKind | undefined;
      };
    }[];
  }>,
) {
  const { body } = message;
  const { data: executionData } = body;
  const funcLogged = {};

  const triggerExecutionData = executionData.filter(
    (execData) =>
      execData.triggerMeta.triggerKind === TriggerKind.EVENT_EXECUTION,
  );
  yield call(logJSActionExecution, triggerExecutionData);

  const allExecutedFunctions = uniq(
    executionData.map((execData) => execData.jsFnFullName),
  );

  for (const fullPath of allExecutedFunctions) {
    const { entityName: JSObjectName, propertyPath: functionName } =
      getEntityNameAndPropertyPath(fullPath);

    if (get(funcLogged, [JSObjectName, functionName])) return;
    set(funcLogged, [JSObjectName, functionName], true);

    const currentJSCollection: ReturnType<typeof getJSCollectionFromName> =
      yield select(getJSCollectionFromName, JSObjectName);
    if (!currentJSCollection) return;

    const currentAction = getJSActionFromJSCollection(
      currentJSCollection,
      functionName,
    );
    if (!currentAction) return;
    const pageName: string = yield select(getCurrentPageName);

    yield put(
      logActionExecutionForAudit({
        actionName: currentAction.name,
        actionId: currentAction.id,
        collectionId: currentJSCollection.config.id,
        pageId: currentAction.pageId,
        pageName,
      }),
    );
  }
}
