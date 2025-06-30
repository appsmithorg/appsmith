import { all, call, put, select } from "redux-saga/effects";
import { handleExecuteJSFunctionSaga } from "sagas/JSPaneSagas";

import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getJSCollectionFromAllEntities } from "ee/selectors/entitiesSelector";
import type { Action } from "entities/Action";
import type { JSAction, JSCollection } from "entities/JSCollection";
import { appsmithTelemetry } from "instrumentation";
import {
  endSpan,
  setAttributesToSpan,
  startRootSpan,
} from "instrumentation/generateTraces";
import log from "loglevel";
import {
  getCurrentPageId,
  getLayoutOnUnloadActions,
} from "selectors/editorSelectors";
import AppsmithConsole from "utils/AppsmithConsole";

// This gets called for "onPageUnload" JS actions
function* executeOnPageUnloadJSAction(pageAction: Action) {
  const collectionId: string = pageAction.collectionId || "";
  const pageId: string | undefined = yield select(getCurrentPageId);

  if (!collectionId) return;

  const collection: JSCollection = yield select(
    getJSCollectionFromAllEntities,
    collectionId,
  );

  if (!collection) {
    appsmithTelemetry.captureException(
      new Error(
        "Collection present in layoutOnUnloadActions but no collection exists ",
      ),
      {
        errorName: "MissingJSCollection",
        extra: {
          collectionId,
          actionId: pageAction.id,
          pageId,
        },
      },
    );

    return;
  }

  const jsAction = collection.actions.find(
    (action: JSAction) => action.id === pageAction.id,
  );

  if (!!jsAction) {
    yield call(handleExecuteJSFunctionSaga, {
      action: jsAction,
      collection,
      isExecuteJSFunc: true,
      onPageLoad: false,
    });
  }
}

export function* executePageUnloadActionsSaga() {
  const span = startRootSpan("executePageUnloadActionsSaga");

  try {
    const pageActions: Action[] = yield select(getLayoutOnUnloadActions);
    const actionCount = pageActions.length;

    setAttributesToSpan(span, { numActions: actionCount });

    // Execute unload actions in parallel batches
    yield all(
      pageActions.map((action) => call(executeOnPageUnloadJSAction, action)),
    );

    // Publish success event after all actions are executed
    yield put({
      type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_SUCCESS,
    });
  } catch (e) {
    log.error(e);
    AppsmithConsole.error({
      text: "Failed to execute actions during page unload",
    });
    // Publish error event if something goes wrong
    yield put({
      type: ReduxActionTypes.EXECUTE_PAGE_UNLOAD_ACTIONS_ERROR,
    });
  }
  endSpan(span);
}
// End of Selection
