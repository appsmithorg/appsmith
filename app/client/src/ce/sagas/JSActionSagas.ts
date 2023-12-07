import type {
  EvaluationReduxAction,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { put, select, call } from "redux-saga/effects";
import {
  updateActionData,
  type FetchActionsPayload,
} from "actions/pluginActionActions";
import type { JSAction, JSCollection } from "entities/JSCollection";
import {
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
  getPageNameByPageId,
} from "@appsmith/selectors/entitiesSelector";
import history from "utils/history";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { JSCollectionCreateUpdateResponse } from "@appsmith/api/JSActionAPI";
import JSActionAPI from "@appsmith/api/JSActionAPI";
import {
  createMessage,
  ERROR_JS_ACTION_COPY_FAIL,
  ERROR_JS_ACTION_MOVE_FAIL,
  ERROR_JS_COLLECTION_RENAME_FAIL,
  JS_ACTION_COPY_SUCCESS,
  JS_ACTION_DELETE_SUCCESS,
  JS_ACTION_MOVE_SUCCESS,
} from "@appsmith/constants/messages";
import { validateResponse } from "../../sagas/ErrorSagas";
import type {
  FetchPageRequest,
  FetchPageResponse,
  PageLayout,
} from "api/PageApi";
import PageApi from "api/PageApi";
import { updateCanvasWithDSL } from "@appsmith/sagas/PageSagas";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import type { ApiResponse } from "api/ApiResponses";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { CreateJSCollectionRequest } from "@appsmith/api/JSActionAPI";
import * as log from "loglevel";
import { builderURL, jsCollectionIdURL } from "@appsmith/RouteBuilder";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { checkAndLogErrorsIfCyclicDependency } from "../../sagas/helper";
import { toast } from "design-system";
import { updateAndSaveLayout } from "actions/pageActions";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { getIsServerDSLMigrationsEnabled } from "selectors/pageSelectors";
import { getWidgets } from "../../sagas/selectors";

export function* fetchJSCollectionsSaga(
  action: EvaluationReduxAction<FetchActionsPayload>,
) {
  const { applicationId } = action.payload;
  try {
    const response: ApiResponse<JSCollection[]> =
      yield JSActionAPI.fetchJSCollections(applicationId);
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
          // @ts-expect-error: response.data is of type unknown
          id: response.data.id,
          // @ts-expect-error: response.data is of type unknown
          name: response.data.name,
        },
      });

      const newAction = response.data;
      // @ts-expect-error: response.data is of type unknown
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
    const response: JSCollectionCreateUpdateResponse =
      yield JSActionAPI.copyJSCollection(copyJSCollection);

    const isValidResponse: boolean = yield validateResponse(response);
    const pageName: string = yield select(
      getPageNameByPageId,
      // @ts-expect-error: response.data is of type unknown
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

      // @ts-expect-error: response.data is of type unknown
      yield put(copyJSCollectionSuccess(payload));
    }
  } catch (e) {
    const actionName = actionObject ? actionObject.name : "";
    toast.show(createMessage(ERROR_JS_ACTION_COPY_FAIL, actionName), {
      kind: "error",
    });
    yield put(copyJSCollectionError(action.payload));
  }
}

export function* handleMoveOrCopySaga(
  actionPayload: ReduxAction<{ id: string }>,
) {
  const { id } = actionPayload.payload;
  const { pageId }: JSCollection = yield select(getJSCollection, id);
  history.push(
    jsCollectionIdURL({
      pageId: pageId,
      collectionId: id,
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
  try {
    const response: ApiResponse = yield JSActionAPI.moveJSCollection({
      collectionId: actionObject.id,
      destinationPageId: action.payload.destinationPageId,
      name: action.payload.name,
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
    // @ts-expect-error: response.data is of type unknown
    yield put(moveJSCollectionSuccess(response.data));
  } catch (e) {
    toast.show(createMessage(ERROR_JS_ACTION_MOVE_FAIL, actionObject.name), {
      kind: "error",
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
    const pageId: string = yield select(getCurrentPageId);
    const response: ApiResponse = yield JSActionAPI.deleteJSCollection(id);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      // @ts-expect-error: response.data is of type unknown
      toast.show(createMessage(JS_ACTION_DELETE_SUCCESS, response.data.name), {
        kind: "success",
      });
      history.push(builderURL({ pageId }));
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

      const widgets: CanvasWidgetsReduxState = yield select(getWidgets);
      yield put(
        updateAndSaveLayout(widgets, {
          shouldReplay: false,
          isRetry: false,
          updatedWidgetIds: [],
        }),
      );
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
      },
    });
    toast.show(
      createMessage(ERROR_JS_COLLECTION_RENAME_FAIL, action.payload.name),
      {
        kind: "error",
      },
    );
    log.error(e);
  }
}

export function* refactorJSObjectName(
  id: string,
  pageId: string,
  oldName: string,
  newName: string,
) {
  const isServerDSLMigrationsEnabled = select(getIsServerDSLMigrationsEnabled);
  const params: FetchPageRequest = { id: pageId };
  if (isServerDSLMigrationsEnabled) {
    params.migrateDSL = true;
  }
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
  const { applicationId } = action.payload;
  try {
    const response: ApiResponse<JSCollection[]> =
      yield JSActionAPI.fetchJSCollectionsForViewMode(applicationId);
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
