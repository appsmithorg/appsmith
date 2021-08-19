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
import { FetchActionsPayload } from "actions/actionActions";
import { JSAction, JSSubAction } from "entities/JSAction";
import {
  createJSActionSuccess,
  deleteJSActionSuccess,
  copyJSActionSuccess,
  copyJSActionError,
  moveJSActionSuccess,
  moveJSActionError,
  fetchJSActionsForPage,
  fetchJSActionsForPageSuccess,
} from "actions/jsActionActions";
import {
  getJSAction,
  getJSActions,
  getPageNameByPageId,
} from "selectors/entitiesSelector";
import history from "utils/history";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { JS_COLLECTION_ID_URL, BUILDER_PAGE_URL } from "constants/routes";
import JSActionAPI, { JSActionCreateUpdateResponse } from "api/JSActionAPI";
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
} from "constants/messages";
import { validateResponse } from "./ErrorSagas";
import { DataTreeJSAction } from "entities/DataTree/dataTreeFactory";
import PageApi from "api/PageApi";
import { updateCanvasWithDSL } from "sagas/PageSagas";
import { JSActionData } from "reducers/entityReducers/jsActionsReducer";
import { GenericApiResponse } from "api/ApiResponses";
import { JSActionViewMode } from "entities/JSAction";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";

export function* fetchJSActionsSaga(
  action: EvaluationReduxAction<FetchActionsPayload>,
) {
  const { applicationId } = action.payload;
  try {
    const response = yield JSActionAPI.fetchJSActions(applicationId);
    yield put({
      type: ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      payload: { error },
    });
  }
}

export function* createJSActionSaga(
  actionPayload: ReduxAction<Partial<JSAction>>,
) {
  try {
    const payload = actionPayload.payload;
    const response: JSActionCreateUpdateResponse = yield JSActionAPI.createJSAction(
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
      yield put(createJSActionSuccess(newAction));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_JS_ACTION_ERROR,
      payload: actionPayload.payload,
    });
  }
}
function* copyJSActionSaga(
  action: ReduxAction<{ id: string; destinationPageId: string; name: string }>,
) {
  const actionObject: JSAction = yield select(getJSAction, action.payload.id);
  try {
    if (!actionObject) throw new Error("Could not find js collection to copy");
    const copyJSAction = Object.assign({}, actionObject, {
      name: action.payload.name,
      pageId: action.payload.destinationPageId,
    }) as Partial<JSAction>;
    delete copyJSAction.id;
    if (copyJSAction.actions && copyJSAction.actions.length > 0) {
      const newJSSubActions: JSSubAction[] = [];
      copyJSAction.actions.forEach((action) => {
        const jsSubAction = JSON.parse(JSON.stringify(action));
        delete jsSubAction.id;
        delete jsSubAction.collectionId;
        newJSSubActions.push(jsSubAction);
      });
      copyJSAction.actions = newJSSubActions;
    }
    const response = yield JSActionAPI.createJSAction(copyJSAction);

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

      yield put(copyJSActionSuccess(payload));
    }
  } catch (e) {
    const actionName = actionObject ? actionObject.name : "";
    Toaster.show({
      text: createMessage(ERROR_JS_ACTION_COPY_FAIL, actionName),
      variant: Variant.danger,
    });
    yield put(copyJSActionError(action.payload));
  }
}

function* handleMoveOrCopySaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const jsAction: JSAction = yield select(getJSAction, id);
  const applicationId = yield select(getCurrentApplicationId);
  history.push(
    JS_COLLECTION_ID_URL(applicationId, jsAction.pageId, jsAction.id),
  );
}

function* moveJSActionSaga(
  action: ReduxAction<{
    id: string;
    destinationPageId: string;
  }>,
) {
  const actionObject: JSAction = yield select(getJSAction, action.payload.id);
  try {
    const response = yield JSActionAPI.moveJSAction({
      collectionId: actionObject.id,
      destinationPageId: action.payload.destinationPageId,
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
    yield put(moveJSActionSuccess(response.data));
  } catch (e) {
    Toaster.show({
      text: createMessage(ERROR_JS_ACTION_MOVE_FAIL, actionObject.name),
      variant: Variant.danger,
    });
    yield put(
      moveJSActionError({
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

export function* deleteJSActionSaga(
  actionPayload: ReduxAction<{ id: string; name: string }>,
) {
  try {
    const id = actionPayload.payload.id;
    const jsActions = yield select(getJSActions);

    const response = yield JSActionAPI.deleteJSAction(id);
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
          history.push(BUILDER_PAGE_URL(applicationId, pageId));
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
      yield put(deleteJSActionSuccess({ id }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_ACTION_ERROR,
      payload: { error, id: actionPayload.payload.id },
    });
  }
}

function* saveJSObjectName(action: ReduxAction<{ id: string; name: string }>) {
  // Takes from state, checks if the name isValid, saves
  const collectionId = action.payload.id;
  const collection = yield select((state) =>
    state.entities.jsActions.find(
      (jsAction: JSActionData) => jsAction.config.id === collectionId,
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
    console.error(e);
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
    const refactorResponse = yield JSActionAPI.updateJSObjectName({
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
        yield put(fetchJSActionsForPage(pageId));
      } else {
        yield put(fetchJSActionsForPage(pageId));
      }
    }
  }
}

export function* fetchJSActionsForPageSaga(
  action: ReduxAction<{ pageId: string }>,
) {
  const { pageId } = action.payload;
  try {
    const response: GenericApiResponse<JSAction[]> = yield call(
      JSActionAPI.fetchJSActionsByPageId,
      pageId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchJSActionsForPageSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_JS_ACTIONS_FOR_PAGE_ERROR,
      payload: { error },
    });
  }
}

export function* fetchJSActionsForViewModeSaga(
  action: ReduxAction<FetchActionsPayload>,
) {
  const { applicationId } = action.payload;
  try {
    const response: GenericApiResponse<JSActionViewMode[]> = yield JSActionAPI.fetchJSActionsForViewMode(
      applicationId,
    );
    const correctFormatResponse = response.data.map((action) => {
      return {
        ...action,
        actionConfiguration: {
          timeoutInMillisecond: action.timeoutInMillisecond,
        },
      };
    });
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_SUCCESS,
        payload: correctFormatResponse,
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
    takeEvery(ReduxActionTypes.FETCH_JS_ACTIONS_INIT, fetchJSActionsSaga),
    takeEvery(ReduxActionTypes.CREATE_JS_ACTION_INIT, createJSActionSaga),
    takeLatest(ReduxActionTypes.COPY_JS_ACTION_INIT, copyJSActionSaga),
    takeEvery(ReduxActionTypes.COPY_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionErrorTypes.COPY_JS_ACTION_ERROR, handleMoveOrCopySaga),
    takeLatest(ReduxActionTypes.MOVE_JS_ACTION_INIT, moveJSActionSaga),
    takeEvery(ReduxActionErrorTypes.MOVE_JS_ACTION_ERROR, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.MOVE_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.MOVE_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeLatest(ReduxActionTypes.DELETE_JS_ACTION_INIT, deleteJSActionSaga),
    takeLatest(ReduxActionTypes.SAVE_JS_COLLECTION_NAME_INIT, saveJSObjectName),
    takeLatest(
      ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_INIT,
      fetchJSActionsForPageSaga,
    ),
    takeEvery(
      ReduxActionTypes.FETCH_JS_ACTIONS_VIEW_MODE_INIT,
      fetchJSActionsForViewModeSaga,
    ),
  ]);
}
