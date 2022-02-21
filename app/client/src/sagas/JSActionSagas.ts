import {
  ReduxAction,
  EvaluationReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import {
  all,
  put,
  takeEvery,
  takeLatest,
  select,
  call,
} from "redux-saga/effects";
import { FetchActionsPayload } from "actions/pluginActionActions";
import { JSCollection, JSAction } from "entities/JSCollection";
import {
  createJSCollectionSuccess,
  deleteJSCollectionSuccess,
  deleteJSCollectionError,
  copyJSCollectionSuccess,
  copyJSCollectionError,
  moveJSCollectionSuccess,
  moveJSCollectionError,
  fetchJSCollectionsForPage,
  fetchJSCollectionsForPageSuccess,
} from "actions/jsActionActions";
import {
  getJSCollection,
  getJSCollections,
  getPageNameByPageId,
} from "selectors/entitiesSelector";
import history from "utils/history";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { JS_COLLECTION_ID_URL, BUILDER_PAGE_URL } from "constants/routes";
import JSActionAPI, { JSCollectionCreateUpdateResponse } from "api/JSActionAPI";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import {
  createMessage,
  JS_ACTION_COPY_SUCCESS,
  ERROR_JS_ACTION_COPY_FAIL,
  JS_ACTION_DELETE_SUCCESS,
  JS_ACTION_CREATED_SUCCESS,
  JS_ACTION_MOVE_SUCCESS,
  ERROR_JS_ACTION_MOVE_FAIL,
  ERROR_JS_COLLECTION_RENAME_FAIL,
} from "@appsmith/constants/messages";
import { validateResponse } from "./ErrorSagas";
import { DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import PageApi from "api/PageApi";
import { updateCanvasWithDSL } from "sagas/PageSagas";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { GenericApiResponse } from "api/ApiResponses";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { CreateJSCollectionRequest } from "api/JSActionAPI";
import * as log from "loglevel";

export function* fetchJSCollectionsSaga(
  action: EvaluationReduxAction<FetchActionsPayload>,
) {
  const { applicationId } = action.payload;
  try {
    const response = yield JSActionAPI.fetchJSCollections(applicationId);
    yield put({
      type: ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      payload: response.data || [],
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      payload: { error },
    });
  }
}

export function* createJSCollectionSaga(
  actionPayload: ReduxAction<CreateJSCollectionRequest>,
) {
  try {
    const payload = actionPayload.payload;
    const response: JSCollectionCreateUpdateResponse = yield JSActionAPI.createJSCollection(
      payload,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const actionName = actionPayload.payload.name
        ? actionPayload.payload.name
        : "";
      Toaster.show({
        text: createMessage(JS_ACTION_CREATED_SUCCESS, actionName),
        variant: Variant.success,
      });

      AppsmithConsole.info({
        text: `JS Object created`,
        source: {
          type: ENTITY_TYPE.JSACTION,
          id: response.data.id,
          name: response.data.name,
        },
      });

      const newAction = response.data;
      yield put(createJSCollectionSuccess(newAction));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_JS_ACTION_ERROR,
      payload: actionPayload.payload,
    });
  }
}
function* copyJSCollectionSaga(
  action: ReduxAction<{ id: string; destinationPageId: string; name: string }>,
) {
  const actionObject: JSCollection = yield select(
    getJSCollection,
    action.payload.id,
  );
  try {
    if (!actionObject) throw new Error("Could not find js collection to copy");
    const copyJSCollection = Object.assign({}, actionObject, {
      name: action.payload.name,
      pageId: action.payload.destinationPageId,
    }) as Partial<JSCollection>;
    delete copyJSCollection.id;
    if (copyJSCollection.actions && copyJSCollection.actions.length > 0) {
      const newJSSubActions: JSAction[] = [];
      copyJSCollection.actions.forEach((action) => {
        const jsSubAction = JSON.parse(JSON.stringify(action));
        delete jsSubAction.id;
        delete jsSubAction.collectionId;
        newJSSubActions.push(jsSubAction);
      });
      copyJSCollection.actions = newJSSubActions;
    }
    const response = yield JSActionAPI.copyJSCollection(copyJSCollection);

    const isValidResponse = yield validateResponse(response);
    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(
          JS_ACTION_COPY_SUCCESS,
          actionObject.name,
          pageName,
        ),
        variant: Variant.success,
      });
      const payload = response.data;

      yield put(copyJSCollectionSuccess(payload));
    }
  } catch (e) {
    const actionName = actionObject ? actionObject.name : "";
    Toaster.show({
      text: createMessage(ERROR_JS_ACTION_COPY_FAIL, actionName),
      variant: Variant.danger,
    });
    yield put(copyJSCollectionError(action.payload));
  }
}

function* handleMoveOrCopySaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const jsAction: JSCollection = yield select(getJSCollection, id);
  const applicationId = yield select(getCurrentApplicationId);
  history.push(
    JS_COLLECTION_ID_URL(applicationId, jsAction.pageId, jsAction.id),
  );
}

function* moveJSCollectionSaga(
  action: ReduxAction<{
    id: string;
    destinationPageId: string;
    name: string;
  }>,
) {
  const actionObject: JSCollection = yield select(
    getJSCollection,
    action.payload.id,
  );
  try {
    const response = yield JSActionAPI.moveJSCollection({
      collectionId: actionObject.id,
      destinationPageId: action.payload.destinationPageId,
      name: action.payload.name,
    });

    const isValidResponse = yield validateResponse(response);
    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(
          JS_ACTION_MOVE_SUCCESS,
          response.data.name,
          pageName,
        ),
        variant: Variant.success,
      });
    }
    yield put(moveJSCollectionSuccess(response.data));
  } catch (e) {
    Toaster.show({
      text: createMessage(ERROR_JS_ACTION_MOVE_FAIL, actionObject.name),
      variant: Variant.danger,
    });
    yield put(
      moveJSCollectionError({
        id: action.payload.id,
        originalPageId: actionObject.pageId,
      }),
    );
  }
}

export const getIndexToBeRedirected = (
  jsActions: Array<DataTreeJSAction>,
  id: string,
): number | undefined => {
  let resultIndex = undefined;
  let redirectIndex = undefined;
  if (jsActions.length > 1) {
    for (let i = 0; i < jsActions.length; i++) {
      if (id === jsActions[i].config.id) {
        resultIndex = i;
      }
    }
  }
  if (resultIndex && resultIndex > 0) {
    redirectIndex = resultIndex - 1;
  } else if (resultIndex === 0 && jsActions.length > 1) {
    redirectIndex = resultIndex + 1;
  }
  return redirectIndex;
};

export function* deleteJSCollectionSaga(
  actionPayload: ReduxAction<{ id: string; name: string }>,
) {
  try {
    const id = actionPayload.payload.id;
    const jsActions = yield select(getJSCollections);

    const response = yield JSActionAPI.deleteJSCollection(id);
    const isValidResponse = yield validateResponse(response);
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(JS_ACTION_DELETE_SUCCESS, response.data.name),
        variant: Variant.success,
      });
      if (jsActions.length > 0) {
        const getIndex = getIndexToBeRedirected(
          jsActions,
          actionPayload.payload.id,
        );
        if (getIndex) {
          const jsAction = jsActions[getIndex];
          history.push(
            JS_COLLECTION_ID_URL(applicationId, pageId, jsAction.config.id),
          );
        } else {
          history.push(
            BUILDER_PAGE_URL({
              applicationId,
              pageId,
            }),
          );
        }
      }
      AppsmithConsole.info({
        logType: LOG_TYPE.ENTITY_DELETED,
        text: "JS object was deleted",
        source: {
          type: ENTITY_TYPE.JSACTION,
          name: response.data.name,
          id: response.data.id,
        },
      });
      yield put(deleteJSCollectionSuccess({ id }));
    }
  } catch (error) {
    yield put(deleteJSCollectionError({ id: actionPayload.payload.id }));
  }
}

function* saveJSObjectName(action: ReduxAction<{ id: string; name: string }>) {
  // Takes from state, checks if the name isValid, saves
  const collectionId = action.payload.id;
  const collection = yield select((state) =>
    state.entities.jsActions.find(
      (jsAction: JSCollectionData) => jsAction.config.id === collectionId,
    ),
  );
  try {
    yield refactorJSObjectName(
      collection.config.id,
      collection.config.pageId,
      collection.config.name,
      action.payload.name,
    );
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_JS_COLLECTION_NAME_ERROR,
      payload: {
        actionId: action.payload.id,
        oldName: collection.config.name,
      },
    });
    Toaster.show({
      text: createMessage(ERROR_JS_COLLECTION_RENAME_FAIL, action.payload.name),
      variant: Variant.danger,
    });
    log.error(e);
  }
}

export function* refactorJSObjectName(
  id: string,
  pageId: string,
  oldName: string,
  newName: string,
) {
  const pageResponse = yield call(PageApi.fetchPage, {
    id: pageId,
  });
  // check if page request is successful
  const isPageRequestSuccessful = yield validateResponse(pageResponse);
  if (isPageRequestSuccessful) {
    // get the layoutId from the page response
    const layoutId = pageResponse.data.layouts[0].id;
    // call to refactor action
    const refactorResponse = yield JSActionAPI.updateJSCollectionOrActionName({
      layoutId,
      actionCollectionId: id,
      pageId: pageId,
      oldName: oldName,
      newName: newName,
    });

    const isRefactorSuccessful = yield validateResponse(refactorResponse);

    const currentPageId = yield select(getCurrentPageId);

    if (isRefactorSuccessful) {
      yield put({
        type: ReduxActionTypes.SAVE_JS_COLLECTION_NAME_SUCCESS,
        payload: {
          actionId: id,
        },
      });
      if (currentPageId === pageId) {
        yield updateCanvasWithDSL(refactorResponse.data, pageId, layoutId);
      } else {
        yield put(fetchJSCollectionsForPage(pageId));
      }
    }
  }
}

export function* fetchJSCollectionsForPageSaga(
  action: ReduxAction<{ pageId: string }>,
) {
  const { pageId } = action.payload;
  try {
    const response: GenericApiResponse<JSCollection[]> = yield call(
      JSActionAPI.fetchJSCollectionsByPageId,
      pageId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchJSCollectionsForPageSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_JS_ACTIONS_FOR_PAGE_ERROR,
      payload: { error },
    });
  }
}

export function* fetchJSCollectionsForViewModeSaga(
  action: ReduxAction<FetchActionsPayload>,
) {
  const { applicationId } = action.payload;
  try {
    const response: GenericApiResponse<JSCollection[]> = yield JSActionAPI.fetchJSCollectionsForViewMode(
      applicationId,
    );
    const resultJSCollections = response.data;
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_SUCCESS,
        payload: resultJSCollections,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_JS_ACTIONS_VIEW_MODE_ERROR,
      payload: { error },
    });
  }
}

export function* watchJSActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_JS_ACTIONS_INIT, fetchJSCollectionsSaga),
    takeEvery(ReduxActionTypes.CREATE_JS_ACTION_INIT, createJSCollectionSaga),
    takeLatest(ReduxActionTypes.COPY_JS_ACTION_INIT, copyJSCollectionSaga),
    takeEvery(ReduxActionTypes.COPY_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionErrorTypes.COPY_JS_ACTION_ERROR, handleMoveOrCopySaga),
    takeLatest(ReduxActionTypes.MOVE_JS_ACTION_INIT, moveJSCollectionSaga),
    takeEvery(ReduxActionErrorTypes.MOVE_JS_ACTION_ERROR, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.MOVE_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.MOVE_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeLatest(ReduxActionTypes.DELETE_JS_ACTION_INIT, deleteJSCollectionSaga),
    takeLatest(ReduxActionTypes.SAVE_JS_COLLECTION_NAME_INIT, saveJSObjectName),
    takeLatest(
      ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_INIT,
      fetchJSCollectionsForPageSaga,
    ),
    takeEvery(
      ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_INIT,
      fetchJSCollectionsForViewModeSaga,
    ),
  ]);
}
