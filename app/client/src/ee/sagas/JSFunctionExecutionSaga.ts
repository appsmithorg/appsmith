export * from "ce/sagas/JSFunctionExecutionSaga";

import { logActionExecutionForAudit } from "actions/jsActionActions";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { put, select } from "redux-saga/effects";
import { getCurrentPageName } from "selectors/editorSelectors";
import {
  getJSCollectionFromName,
  getJSActionFromJSCollection,
} from "selectors/entitiesSelector";
import { TMessage } from "utils/MessageUtil";

export function* logJSFunctionExecution(message: TMessage<any>) {
  const { body } = message;
  const { data } = body;
  const { fullPath } = data;
  const {
    entityName: JSObjectName,
    propertyPath: functionName,
  } = getEntityNameAndPropertyPath(fullPath);

  const currentJSCollection: ReturnType<typeof getJSCollectionFromName> = yield select(
    getJSCollectionFromName,
    JSObjectName,
  );
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
