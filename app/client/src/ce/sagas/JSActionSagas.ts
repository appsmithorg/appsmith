import type { ReduxAction } from "../../actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { put, select, call } from "redux-saga/effects";
import {
  updateActionData,
  type FetchActionsPayload,
} from "actions/pluginActionActions";
import type { JSAction, JSCollection } from "entities/JSCollection";
import {
  closeJSActionTab,
  closeJsActionTabSuccess,
  copyJSCollectionError,
  copyJSCollectionSuccess,
  createJSCollectionSuccess,
  deleteJSCollectionError,
  deleteJSCollectionSuccess,
  fetchJSCollectionsForPage,
  fetchJSCollectionsForPageSuccess,
  moveJSCollectionError,
  moveJSCollectionSuccess,
} from "actions/jsActionActions";
import {
  getJSCollection,
  getNewEntityName,
  getPageNameByPageId,
} from "ee/selectors/entitiesSelector";
import history from "utils/history";
import {
  getCurrentBasePageId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import type { JSCollectionCreateUpdateResponse } from "ee/api/JSActionAPI";
import JSActionAPI from "ee/api/JSActionAPI";
import {
  createMessage,
  ERROR_JS_ACTION_COPY_FAIL,
  ERROR_JS_ACTION_MOVE_FAIL,
  ERROR_JS_COLLECTION_RENAME_FAIL,
  JS_ACTION_COPY_SUCCESS,
  JS_ACTION_DELETE_SUCCESS,
  JS_ACTION_MOVE_SUCCESS,
} from "ee/constants/messages";
import { validateResponse } from "sagas/ErrorSagas";
import type {
  FetchPageRequest,
  FetchPageResponse,
  PageLayout,
} from "api/PageApi";
import PageApi from "api/PageApi";
import { updateCanvasWithDSL } from "ee/sagas/PageSagas";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import type { ApiResponse } from "api/ApiResponses";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { CreateJSCollectionRequest } from "ee/api/JSActionAPI";
import * as log from "loglevel";
import { builderURL, jsCollectionIdURL } from "ee/RouteBuilder";
import type { EventLocation } from "ee/utils/analyticsUtilTypes";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  checkAndLogErrorsIfCyclicDependency,
  getFromServerWhenNoPrefetchedResult,
} from "sagas/helper";
import { toast } from "@appsmith/ads";
import { updateAndSaveLayout } from "actions/pageActions";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgets } from "sagas/selectors";
import FocusRetention from "sagas/FocusRetentionSaga";
import { handleJSEntityRedirect } from "sagas/IDESaga";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import { IDE_TYPE } from "ee/entities/IDE/constants";
import { CreateNewActionKey } from "ee/entities/Engine/actionHelpers";
import { getAllActionTestPayloads } from "utils/storage";
import { convertToBasePageIdSelector } from "selectors/pageListSelectors";
import type { EvaluationReduxAction } from "../../actions/EvaluationReduxActionTypes";

export function* fetchJSCollectionsSaga(
  action: EvaluationReduxAction<FetchActionsPayload>,
) {
  const { unpublishedActionCollections, ...payload } = action.payload;

  try {
    const response: ApiResponse<JSCollection[]> = yield call(
      getFromServerWhenNoPrefetchedResult,
      unpublishedActionCollections,
      async () => JSActionAPI.fetchJSCollections(payload),
    );

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
  actionPayload: ReduxAction<{
    request: CreateJSCollectionRequest;
    from: EventLocation;
  }>,
) {
  try {
    const payload = actionPayload.payload.request;
    const response: JSCollectionCreateUpdateResponse =
      yield JSActionAPI.createJSCollection(payload);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const actionName = payload.name ? payload.name : "";

      AnalyticsUtil.logEvent("JS_OBJECT_CREATED", {
        name: actionName,
        from: actionPayload.payload.from,
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

export function* copyJSCollectionSaga(
  action: ReduxAction<{ id: string; destinationPageId: string; name: string }>,
) {
  const actionObject: JSCollection = yield select(
    getJSCollection,
    action.payload.id,
  );
  const newName: string = yield select(getNewEntityName, {
    prefix: action.payload.name,
    parentEntityId: action.payload.destinationPageId,
    parentEntityKey: CreateNewActionKey.PAGE,
    suffix: "Copy",
    startWithoutIndex: true,
  });

  try {
    if (!actionObject) throw new Error("Could not find js collection to copy");

    const copyJSCollection = Object.assign({}, actionObject, {
      name: newName,
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

    const response: JSCollectionCreateUpdateResponse =
      yield JSActionAPI.copyJSCollection(copyJSCollection);

    const isValidResponse: boolean = yield validateResponse(response);
    const pageName: string = yield select(
      getPageNameByPageId,
      response.data.pageId,
    );

    if (isValidResponse) {
      toast.show(
        createMessage(JS_ACTION_COPY_SUCCESS, actionObject.name, pageName),
        {
          kind: "success",
        },
      );
      const payload = response.data;

      yield put(copyJSCollectionSuccess(payload));
    }
  } catch (e) {
    const actionName = actionObject ? actionObject.name : "";

    yield put(
      copyJSCollectionError({
        ...action.payload,
        show: true,
        error: {
          message: createMessage(ERROR_JS_ACTION_COPY_FAIL, actionName),
        },
      }),
    );
  }
}

export function* handleMoveOrCopySaga(
  actionPayload: ReduxAction<JSCollection>,
) {
  const { baseId: baseCollectionId, pageId } = actionPayload.payload;
  const basePageId: string = yield select(convertToBasePageIdSelector, pageId);

  history.push(
    jsCollectionIdURL({
      basePageId,
      baseCollectionId: baseCollectionId,
    }),
  );
}

export function* moveJSCollectionSaga(
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
  const newName: string = yield select(getNewEntityName, {
    prefix: action.payload.name,
    parentEntityId: action.payload.destinationPageId,
    parentEntityKey: CreateNewActionKey.PAGE,
    startWithoutIndex: true,
  });

  try {
    const response: ApiResponse = yield JSActionAPI.moveJSCollection({
      collectionId: actionObject.id,
      destinationPageId: action.payload.destinationPageId,
      name: newName,
    });

    const isValidResponse: boolean = yield validateResponse(response);
    const pageName: string = yield select(
      getPageNameByPageId,
      // @ts-expect-error: response.data is of type unknown
      response.data.pageId,
    );

    if (isValidResponse) {
      toast.show(
        createMessage(
          JS_ACTION_MOVE_SUCCESS,
          // @ts-expect-error: response.data is of type unknown
          response.data.name,
          pageName,
        ),
        {
          kind: "success",
        },
      );
    }

    yield call(
      closeJSActionTabSaga,
      closeJSActionTab({
        id: action.payload.id,
        parentId: actionObject.pageId,
      }),
    );
    // @ts-expect-error: response.data is of type unknown
    yield put(moveJSCollectionSuccess(response.data));
  } catch (e) {
    yield put(
      moveJSCollectionError({
        id: action.payload.id,
        originalPageId: actionObject.pageId,
        show: true,
        error: {
          message: createMessage(ERROR_JS_ACTION_MOVE_FAIL, actionObject.name),
        },
      }),
    );
  }
}

export const getIndexToBeRedirected = (
  jsActions: Array<JSCollectionData>,
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
    const currentUrl = window.location.pathname;
    const basePageId: string = yield select(getCurrentBasePageId);
    const response: ApiResponse = yield JSActionAPI.deleteJSCollection(id);
    const isValidResponse: boolean = yield validateResponse(response);
    const ideType = getIDETypeByUrl(currentUrl);

    if (isValidResponse) {
      // @ts-expect-error: response.data is of type unknown
      toast.show(createMessage(JS_ACTION_DELETE_SUCCESS, response.data.name), {
        kind: "success",
      });
      yield call(FocusRetention.handleRemoveFocusHistory, currentUrl);

      if (ideType === IDE_TYPE.App) {
        yield call(handleJSEntityRedirect, id);
      } else {
        history.push(builderURL({ basePageId }));
      }

      AppsmithConsole.info({
        logType: LOG_TYPE.ENTITY_DELETED,
        text: "JS Object was deleted",
        source: {
          type: ENTITY_TYPE.JSACTION,
          // @ts-expect-error: response.data is of type unknown
          name: response.data.name,
          // @ts-expect-error: response.data is of type unknown
          id: response.data.id,
        },
      });
      yield put(deleteJSCollectionSuccess({ id }));
      yield put(closeJsActionTabSuccess({ id, parentId: basePageId }));

      const widgets: CanvasWidgetsReduxState = yield select(getWidgets);

      if (basePageId) {
        yield put(
          updateAndSaveLayout(widgets, {
            shouldReplay: false,
            isRetry: false,
            updatedWidgetIds: [],
          }),
        );
      }
    }
  } catch (error) {
    yield put(deleteJSCollectionError({ id: actionPayload.payload.id }));
  }
}

export function* saveJSObjectName(
  action: ReduxAction<{ id: string; name: string }>,
) {
  // Takes from state, checks if the name isValid, saves
  const collectionId = action.payload.id;
  const collection: JSCollectionData | undefined = yield select((state) =>
    state.entities.jsActions.find(
      (jsAction: JSCollectionData) => jsAction.config.id === collectionId,
    ),
  );

  if (!collection) return;

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
        show: true,
        error: {
          message: createMessage(
            ERROR_JS_COLLECTION_RENAME_FAIL,
            action.payload.name,
          ),
        },
      },
    });
  }
}

export function* refactorJSObjectName(
  id: string,
  pageId: string,
  oldName: string,
  newName: string,
) {
  const params: FetchPageRequest = { pageId, migrateDSL: true };
  const pageResponse: FetchPageResponse = yield call(PageApi.fetchPage, params);
  // check if page request is successful
  const isPageRequestSuccessful: boolean = yield validateResponse(pageResponse);

  if (isPageRequestSuccessful) {
    // get the layoutId from the page response
    const layoutId = pageResponse.data.layouts[0].id;
    // call to refactor action
    const refactorResponse: ApiResponse =
      yield JSActionAPI.updateJSCollectionOrActionName({
        layoutId,
        actionCollectionId: id,
        pageId: pageId,
        oldName: oldName,
        newName: newName,
      });

    const isRefactorSuccessful: boolean =
      yield validateResponse(refactorResponse);

    const currentPageId: string | undefined = yield select(getCurrentPageId);

    if (isRefactorSuccessful) {
      yield put({
        type: ReduxActionTypes.SAVE_JS_COLLECTION_NAME_SUCCESS,
        payload: {
          actionId: id,
        },
      });
      const jsObject: JSCollection = yield select((state) =>
        getJSCollection(state, id),
      );
      const functions = jsObject.actions;

      if (currentPageId === pageId) {
        // @ts-expect-error: refactorResponse.data is of type unknown
        yield updateCanvasWithDSL(refactorResponse.data, pageId, layoutId);
        yield put(
          updateActionData(
            functions.map((f) => ({
              entityName: newName,
              data: undefined,
              dataPath: `${f.name}.data`,
              dataPathRef: `${oldName}.${f.name}.data`,
            })),
          ),
        );
      } else {
        yield put(fetchJSCollectionsForPage(pageId));
      }

      checkAndLogErrorsIfCyclicDependency(
        (refactorResponse.data as PageLayout).layoutOnLoadActionErrors,
      );
    }
  }
}

export function* fetchJSCollectionsForPageSaga(
  action: ReduxAction<{ pageId: string }>,
) {
  const { pageId } = action.payload;

  try {
    const response: ApiResponse<JSCollection[]> = yield call(
      JSActionAPI.fetchJSCollectionsByPageId,
      pageId,
    );
    const isValidResponse: boolean = yield validateResponse(response);

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
  const { applicationId, publishedActionCollections } = action.payload;

  try {
    const response: ApiResponse<JSCollection[]> = yield call(
      getFromServerWhenNoPrefetchedResult,
      publishedActionCollections,
      async () => JSActionAPI.fetchJSCollectionsForViewMode(applicationId),
    );

    const resultJSCollections = response.data;
    const isValidResponse: boolean = yield validateResponse(response);

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

export function* closeJSActionTabSaga(
  actionPayload: ReduxAction<{ id: string; parentId: string }>,
) {
  const { id, parentId } = actionPayload.payload;
  const currentUrl = window.location.pathname;

  yield call(FocusRetention.handleRemoveFocusHistory, currentUrl);
  yield call(handleJSEntityRedirect, id);
  yield put(closeJsActionTabSuccess({ id, parentId }));
}

// Saga to fetch stored test payloads for all collections present in the application
export function* fetchStoredTestPayloadsSaga(collections: JSCollection[]) {
  try {
    //fetch stored test payloads for all collections
    const storedPayloads: Record<string, unknown> | null =
      yield getAllActionTestPayloads();

    if (!!storedPayloads && collections.length > 0) {
      for (const collection of collections) {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const testPayloadForCollection: Record<string, any> = {};
        let hasStoredPayload = false;

        for (const action of collection.actions) {
          if (
            storedPayloads.hasOwnProperty(action.id) &&
            !!storedPayloads[action.id]
          ) {
            hasStoredPayload = true;
            testPayloadForCollection[action.id] = storedPayloads[action.id];
          }
        }

        if (hasStoredPayload) {
          yield put({
            type: ReduxActionTypes.UPDATE_TEST_PAYLOAD_FOR_COLLECTION,
            payload: {
              collectionId: collection.id,
              testPayload: testPayloadForCollection,
            },
          });
        }
      }
    }
  } catch (error) {
    log.error("Error fetching stored test payloads", error);
  }
}
