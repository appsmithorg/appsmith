import {
  all,
  select,
  put,
  takeEvery,
  debounce,
  call,
  take,
} from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getJSCollection, getJSCollections } from "selectors/entitiesSelector";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { createNewJSFunctionName, getQueryParams } from "utils/AppsmithUtils";
import { JSCollection, JSAction } from "entities/JSCollection";
import { createJSCollectionRequest } from "actions/jsActionActions";
import { JS_COLLECTION_ID_URL } from "constants/routes";
import history from "utils/history";
import { executeFunction } from "./EvaluationsSaga";
import { getJSCollectionIdFromURL } from "pages/Editor/Explorer/helpers";
import {
  getDifferenceInJSCollection,
  JSUpdate,
  pushLogsForObjectUpdate,
  createDummyJSCollectionActions,
} from "../utils/JSPaneUtils";
import JSActionAPI, { RefactorAction } from "../api/JSActionAPI";
import {
  updateJSCollectionSuccess,
  refactorJSCollectionAction,
  updateJSCollectionBodySuccess,
} from "actions/jsPaneActions";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { getPluginIdOfPackageName } from "sagas/selectors";
import { PluginType } from "entities/Action";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import {
  createMessage,
  ERROR_JS_COLLECTION_RENAME_FAIL,
  JS_EXECUTION_SUCCESS,
  JS_EXECUTION_FAILURE,
  JS_EXECUTION_FAILURE_TOASTER,
  JS_FUNCTION_CREATE_SUCCESS,
  JS_FUNCTION_DELETE_SUCCESS,
  JS_FUNCTION_UPDATE_SUCCESS,
} from "@appsmith/constants/messages";
import { validateResponse } from "./ErrorSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE, PLATFORM_ERROR } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import PageApi from "api/PageApi";
import { updateCanvasWithDSL } from "sagas/PageSagas";
export const JS_PLUGIN_PACKAGE_NAME = "js-plugin";
import { updateReplayEntity } from "actions/pageActions";

function* handleCreateNewJsActionSaga(action: ReduxAction<{ pageId: string }>) {
  const organizationId: string = yield select(getCurrentOrgId);
  const applicationId = yield select(getCurrentApplicationId);
  const { pageId } = action.payload;
  const pluginId: string = yield select(
    getPluginIdOfPackageName,
    JS_PLUGIN_PACKAGE_NAME,
  );
  if (pageId && pluginId) {
    const jsActions = yield select(getJSCollections);
    const pageJSActions = jsActions.filter(
      (a: JSCollectionData) => a.config.pageId === pageId,
    );
    const newJSCollectionName = createNewJSFunctionName(pageJSActions, pageId);
    const { actions, body } = createDummyJSCollectionActions(
      pageId,
      organizationId,
    );
    yield put(
      createJSCollectionRequest({
        name: newJSCollectionName,
        pageId,
        organizationId,
        pluginId,
        body: body,
        variables: [
          {
            name: "myVar1",
            value: [],
          },
          {
            name: "myVar2",
            value: {},
          },
        ],
        actions: actions,
        applicationId,
        pluginType: PluginType.JS,
      }),
    );
  }
}

function* handleJSCollectionCreatedSaga(
  actionPayload: ReduxAction<JSCollection>,
) {
  const { id } = actionPayload.payload;
  const applicationId = yield select(getCurrentApplicationId);
  const pageId = yield select(getCurrentPageId);
  history.push(JS_COLLECTION_ID_URL(applicationId, pageId, id, {}));
}

function* handleEachUpdateJSCollection(update: JSUpdate) {
  const jsActionId = update.id;
  const organizationId: string = yield select(getCurrentOrgId);
  if (jsActionId) {
    const jsAction: JSCollection = yield select(getJSCollection, jsActionId);
    const parsedBody = update.parsedBody;
    const jsActionTobeUpdated = JSON.parse(JSON.stringify(jsAction));
    if (parsedBody) {
      // jsActionTobeUpdated.body = jsAction.body;
      const data = getDifferenceInJSCollection(parsedBody, jsAction);
      if (data.nameChangedActions.length) {
        for (let i = 0; i < data.nameChangedActions.length; i++) {
          yield put(
            refactorJSCollectionAction({
              refactorAction: {
                actionId: data.nameChangedActions[i].id,
                collectionName: jsAction.name,
                pageId: data.nameChangedActions[i].pageId,
                oldName: data.nameChangedActions[i].oldName,
                newName: data.nameChangedActions[i].newName,
              },
              actionCollection: jsActionTobeUpdated,
            }),
          );
        }
      } else {
        let newActions: Partial<JSAction>[] = [];
        let updateActions: JSAction[] = [];
        let deletedActions: JSAction[] = [];
        let updateCollection = false;
        const changedVariables = data.changedVariables;
        if (changedVariables.length) {
          jsActionTobeUpdated.variables = parsedBody.variables;
          updateCollection = true;
        }
        if (data.newActions.length) {
          newActions = data.newActions;
          for (let i = 0; i < data.newActions.length; i++) {
            jsActionTobeUpdated.actions.push({
              ...data.newActions[i],
              organizationId: organizationId,
            });
          }
          updateCollection = true;
        }
        if (data.updateActions.length > 0) {
          updateActions = data.updateActions;
          let changedActions = [];
          for (let i = 0; i < data.updateActions.length; i++) {
            changedActions = jsActionTobeUpdated.actions.map(
              (js: JSAction) =>
                data.updateActions.find(
                  (update: JSAction) => update.id === js.id,
                ) || js,
            );
          }
          updateCollection = true;
          jsActionTobeUpdated.actions = changedActions;
        }
        if (data.deletedActions.length > 0) {
          deletedActions = data.deletedActions;
          const nonDeletedActions = jsActionTobeUpdated.actions.filter(
            (js: JSAction) => {
              return !data.deletedActions.find((deleted) => {
                return deleted.id === js.id;
              });
            },
          );
          updateCollection = true;
          jsActionTobeUpdated.actions = nonDeletedActions;
        }
        if (updateCollection) {
          yield call(updateJSCollection, {
            jsCollection: jsActionTobeUpdated,
            newActions: newActions,
            updatedActions: updateActions,
            deletedActions: deletedActions,
          });
        }
      }
    }
  }
}

export function* makeUpdateJSCollection(jsUpdates: Record<string, JSUpdate>) {
  yield all(
    Object.keys(jsUpdates).map((key) =>
      call(handleEachUpdateJSCollection, jsUpdates[key]),
    ),
  );
}

function* updateJSCollection(data: {
  jsCollection: JSCollection;
  newActions?: Partial<JSAction>[];
  updatedActions?: JSAction[];
  deletedActions?: JSAction[];
}) {
  let jsAction = {};
  const jsActionId = getJSCollectionIdFromURL();
  if (jsActionId) {
    jsAction = yield select(getJSCollection, jsActionId);
  }
  try {
    const { deletedActions, jsCollection, newActions, updatedActions } = data;
    if (jsCollection) {
      const response = yield JSActionAPI.updateJSCollection(jsCollection);
      const isValidResponse = yield validateResponse(response);
      if (isValidResponse) {
        if (newActions && newActions.length) {
          pushLogsForObjectUpdate(
            newActions,
            jsCollection,
            createMessage(JS_FUNCTION_CREATE_SUCCESS),
          );
        }
        if (updatedActions && updatedActions.length) {
          pushLogsForObjectUpdate(
            updatedActions,
            jsCollection,
            createMessage(JS_FUNCTION_UPDATE_SUCCESS),
          );
        }
        if (deletedActions && deletedActions.length) {
          pushLogsForObjectUpdate(
            deletedActions,
            jsCollection,
            createMessage(JS_FUNCTION_DELETE_SUCCESS),
          );
        }
        yield put(updateJSCollectionSuccess({ data: response?.data }));
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_JS_ACTION_ERROR,
      payload: { error, data: jsAction },
    });
  }
}

function* handleJSObjectNameChangeSuccessSaga(
  action: ReduxAction<{ actionId: string }>,
) {
  const { actionId } = action.payload;
  const actionObj = yield select(getJSCollection, actionId);
  yield take(ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_SUCCESS);
  if (!actionObj) {
    // Error case, log to sentry
    Toaster.show({
      text: createMessage(ERROR_JS_COLLECTION_RENAME_FAIL, ""),
      variant: Variant.danger,
    });

    return;
  }
  if (actionObj.pluginType === PluginType.API) {
    const params = getQueryParams();
    if (params.editName) {
      params.editName = "false";
    }
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    history.push(JS_COLLECTION_ID_URL(applicationId, pageId, actionId, params));
  }
}

function* handleExecuteJSFunctionSaga(
  data: ReduxAction<{
    collectionName: string;
    action: JSAction;
    collectionId: string;
  }>,
): any {
  const { action, collectionId, collectionName } = data.payload;
  const actionId = action.id;
  try {
    const result = yield call(executeFunction, collectionName, action);

    yield put({
      type: ReduxActionTypes.EXECUTE_JS_FUNCTION_SUCCESS,
      payload: {
        results: result,
        collectionId,
        actionId,
      },
    });
    AppsmithConsole.info({
      text: createMessage(JS_EXECUTION_SUCCESS),
      source: {
        type: ENTITY_TYPE.JSACTION,
        name: collectionName + "." + action.name,
        id: collectionId,
      },
      state: { response: result },
    });
  } catch (e) {
    AppsmithConsole.addError({
      id: actionId,
      logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
      text: createMessage(JS_EXECUTION_FAILURE),
      source: {
        type: ENTITY_TYPE.JSACTION,
        name: collectionName + "." + action.name,
        id: collectionId,
      },
      messages: [
        {
          message: e.message,
          type: PLATFORM_ERROR.PLUGIN_EXECUTION,
        },
      ],
    });
    Toaster.show({
      text: e.message || createMessage(JS_EXECUTION_FAILURE_TOASTER),
      variant: Variant.danger,
      showDebugButton: true,
    });
  }
}

function* handleUpdateJSCollectionBody(
  actionPayload: ReduxAction<{ body: string; id: string; isReplay: boolean }>,
) {
  const jsCollection = yield select(getJSCollection, actionPayload.payload.id);
  jsCollection.body = actionPayload.payload.body;
  try {
    if (jsCollection) {
      const response = yield JSActionAPI.updateJSCollection(jsCollection);
      const isValidResponse = yield validateResponse(response);
      if (isValidResponse) {
        yield put(updateJSCollectionBodySuccess({ data: response?.data }));
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_JS_ACTION_BODY_ERROR,
      payload: { error, data: jsCollection },
    });
  }
  if (!actionPayload.payload.isReplay)
    yield put(
      updateReplayEntity(
        actionPayload.payload.id,
        {
          id: actionPayload.payload.id,
          body: actionPayload.payload.body,
        },
        ENTITY_TYPE.JSACTION,
      ),
    );
}

function* handleRefactorJSActionNameSaga(
  data: ReduxAction<{
    refactorAction: RefactorAction;
    actionCollection: JSCollection;
  }>,
) {
  const pageResponse = yield call(PageApi.fetchPage, {
    id: data.payload.refactorAction.pageId,
  });
  const isPageRequestSuccessful = yield validateResponse(pageResponse);
  if (isPageRequestSuccessful) {
    // get the layoutId from the page response
    const layoutId = pageResponse.data.layouts[0].id;
    const requestData = {
      refactorAction: {
        ...data.payload.refactorAction,
        layoutId: layoutId,
      },
      actionCollection: data.payload.actionCollection,
    };
    // call to refactor action
    try {
      const refactorResponse = yield JSActionAPI.updateJSCollectionActionRefactor(
        requestData,
      );

      const isRefactorSuccessful = yield validateResponse(refactorResponse);

      const currentPageId = yield select(getCurrentPageId);

      if (isRefactorSuccessful) {
        yield put({
          type: ReduxActionTypes.REFACTOR_JS_ACTION_NAME_SUCCESS,
          payload: { collectionId: data.payload.actionCollection.id },
        });
        if (currentPageId === data.payload.refactorAction.pageId) {
          yield updateCanvasWithDSL(
            refactorResponse.data,
            data.payload.refactorAction.pageId,
            layoutId,
          );
        }
      }
    } catch (error) {
      yield put({
        type: ReduxActionErrorTypes.REFACTOR_JS_ACTION_NAME_ERROR,
        payload: { collectionId: data.payload.actionCollection.id },
      });
    }
  }
}

export default function* root() {
  yield all([
    takeEvery(
      ReduxActionTypes.CREATE_NEW_JS_ACTION,
      handleCreateNewJsActionSaga,
    ),
    takeEvery(
      ReduxActionTypes.CREATE_JS_ACTION_SUCCESS,
      handleJSCollectionCreatedSaga,
    ),
    takeEvery(
      ReduxActionTypes.SAVE_JS_COLLECTION_NAME_SUCCESS,
      handleJSObjectNameChangeSuccessSaga,
    ),
    takeEvery(
      ReduxActionTypes.EXECUTE_JS_FUNCTION_INIT,
      handleExecuteJSFunctionSaga,
    ),
    takeEvery(
      ReduxActionTypes.REFACTOR_JS_ACTION_NAME,
      handleRefactorJSActionNameSaga,
    ),
    debounce(
      100,
      ReduxActionTypes.UPDATE_JS_ACTION_BODY_INIT,
      handleUpdateJSCollectionBody,
    ),
  ]);
}
