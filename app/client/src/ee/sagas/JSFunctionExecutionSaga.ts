export * from "ce/sagas/JSFunctionExecutionSaga";

import { logActionExecutionForAudit } from "actions/jsActionActions";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { put, select } from "redux-saga/effects";
import { getCurrentPageName } from "selectors/editorSelectors";
import {
  getJSCollectionFromName,
  getJSActionFromJSCollection,
} from "selectors/entitiesSelector";
import type { TMessage } from "utils/MessageUtil";
import { get, isArray, isString, set } from "lodash";

export function* logJSFunctionExecution(
  message: TMessage<{
    data: unknown;
  }>,
) {
  const { body } = message;
  const { data: paths } = body;
  if (!isArray(paths)) return;
  const funcLogged = {};

  for (const fullPath of paths) {
    if (!isString(fullPath)) return;
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
