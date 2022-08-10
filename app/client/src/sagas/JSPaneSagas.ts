import {
  all,
  select,
  put,
  takeEvery,
  debounce,
  call,
  take,
  takeLatest,
} from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsSavingEntity,
} from "selectors/editorSelectors";
import { getJSCollection, getJSCollections } from "selectors/entitiesSelector";
import {
  JSCollectionData,
  JSCollectionDataState,
} from "reducers/entityReducers/jsActionsReducer";
import { createNewJSFunctionName } from "utils/AppsmithUtils";
import { getQueryParams } from "utils/URLUtils";
import { JSCollection, JSAction } from "entities/JSCollection";
import { createJSCollectionRequest } from "actions/jsActionActions";
import history from "utils/history";
import { executeFunction } from "./EvaluationsSaga";
import { getJSCollectionIdFromURL } from "pages/Editor/Explorer/helpers";
import {
  getDifferenceInJSCollection,
  JSUpdate,
  pushLogsForObjectUpdate,
  createDummyJSCollectionActions,
} from "utils/JSPaneUtils";
import JSActionAPI, {
  JSCollectionCreateUpdateResponse,
  RefactorAction,
  SetFunctionPropertyPayload,
} from "api/JSActionAPI";
import ActionAPI from "api/ActionAPI";
import {
  updateJSCollectionSuccess,
  refactorJSCollectionAction,
  updateJSCollectionBodySuccess,
  updateJSFunction,
  executeJSFunctionInit,
} from "actions/jsPaneActions";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
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
  JS_EXECUTION_SUCCESS_TOASTER,
  JS_FUNCTION_CREATE_SUCCESS,
  JS_FUNCTION_DELETE_SUCCESS,
  JS_FUNCTION_UPDATE_SUCCESS,
} from "@appsmith/constants/messages";
import { validateResponse } from "./ErrorSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE, PLATFORM_ERROR } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import PageApi, { FetchPageResponse } from "api/PageApi";
import { updateCanvasWithDSL } from "sagas/PageSagas";
export const JS_PLUGIN_PACKAGE_NAME = "js-plugin";
import { set } from "lodash";
import { updateReplayEntity } from "actions/pageActions";
import { jsCollectionIdURL } from "RouteBuilder";
import { ApiResponse } from "api/ApiResponses";
import { shouldBeDefined } from "utils/helpers";
import { ModalType } from "reducers/uiReducers/modalActionReducer";
import { requestModalConfirmationSaga } from "sagas/UtilSagas";
import { UserCancelledActionExecutionError } from "sagas/ActionExecution/errorUtils";
import { APP_MODE } from "entities/App";
import { getAppMode } from "selectors/applicationSelectors";

function* handleCreateNewJsActionSaga(action: ReduxAction<{ pageId: string }>) {
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const applicationId: string = yield select(getCurrentApplicationId);
  const { pageId } = action.payload;
  const pluginId: string = yield select(
    getPluginIdOfPackageName,
    JS_PLUGIN_PACKAGE_NAME,
  );
  if (pageId && pluginId) {
    const jsActions: JSCollectionDataState = yield select(getJSCollections);
    const pageJSActions = jsActions.filter(
      (a: JSCollectionData) => a.config.pageId === pageId,
    );
    const newJSCollectionName = createNewJSFunctionName(pageJSActions, pageId);
    const { actions, body } = createDummyJSCollectionActions(
      pageId,
      workspaceId,
    );
    yield put(
      createJSCollectionRequest({
        name: newJSCollectionName,
        pageId,
        workspaceId,
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
  const { id, pageId } = actionPayload.payload;
  history.push(
    jsCollectionIdURL({
      pageId,
      collectionId: id,
      params: {
        editName: true,
      },
    }),
  );
}

function* handleEachUpdateJSCollection(update: JSUpdate) {
  const jsActionId = update.id;
  const workspaceId: string = yield select(getCurrentWorkspaceId);
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
              workspaceId: workspaceId,
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
      const response: JSCollectionCreateUpdateResponse = yield JSActionAPI.updateJSCollection(
        jsCollection,
      );
      const isValidResponse: boolean = yield validateResponse(response);
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
          // delete all execution error logs for deletedActions if present
          deletedActions.forEach((action) =>
            AppsmithConsole.deleteError(`${jsCollection.id}-${action.id}`),
          );
        }

        yield put(
          updateJSCollectionSuccess({
            // @ts-expect-error: data is of type unknown
            data: response?.data,
          }),
        );
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
  const actionObj: JSCollection | undefined = yield select(
    getJSCollection,
    actionId,
  );
  yield take(ReduxActionTypes.FETCH_JS_ACTIONS_FOR_PAGE_SUCCESS);
  if (!actionObj) {
    // Error case, log to sentry
    Toaster.show({
      text: createMessage(ERROR_JS_COLLECTION_RENAME_FAIL, ""),
      variant: Variant.danger,
    });

    return;
  }

  if (actionObj.pluginType === PluginType.JS) {
    const params = getQueryParams();
    if (params.editName) {
      params.editName = "false";
    }
    history.push(
      jsCollectionIdURL({
        pageId: actionObj.pageId,
        collectionId: actionId,
        params,
      }),
    );
  }
}

export function* handleExecuteJSFunctionSaga(data: {
  collectionName: string;
  action: JSAction;
  collectionId: string;
}): any {
  const { action, collectionId, collectionName } = data;
  const actionId = action.id;
  const appMode: APP_MODE = yield select(getAppMode);
  yield put(
    executeJSFunctionInit({
      collectionName,
      action,
      collectionId,
    }),
  );

  const isEntitySaving = yield select(getIsSavingEntity);

  /**
   * Only start executing when no entity in the application is saving
   * This ensures that execution doesn't get carried out on stale values
   * This includes other entities which might be bound in the JS Function
   */
  if (isEntitySaving) {
    yield take(ReduxActionTypes.ENTITY_UPDATE_SUCCESS);
  }

  try {
    const { isDirty, result } = yield call(
      executeFunction,
      collectionName,
      action,
      collectionId,
    );
    yield put({
      type: ReduxActionTypes.EXECUTE_JS_FUNCTION_SUCCESS,
      payload: {
        results: result,
        collectionId,
        actionId,
        isDirty,
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
    appMode === APP_MODE.EDIT &&
      !isDirty &&
      Toaster.show({
        text: createMessage(JS_EXECUTION_SUCCESS_TOASTER, action.name),
        variant: Variant.success,
      });
  } catch (error) {
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
          message: (error as Error).message,
          type: PLATFORM_ERROR.PLUGIN_EXECUTION,
        },
      ],
    });
    Toaster.show({
      text:
        (error as Error).message || createMessage(JS_EXECUTION_FAILURE_TOASTER),
      variant: Variant.danger,
      showDebugButton: true,
    });
  }
}

export function* handleStartExecuteJSFunctionSaga(
  data: ReduxAction<{
    collectionName: string;
    action: JSAction;
    collectionId: string;
  }>,
): any {
  const { action, collectionId, collectionName } = data.payload;
  const actionId = action.id;
  if (action.confirmBeforeExecute) {
    const modalPayload = {
      name: collectionName + "." + action.name,
      modalOpen: true,
      modalType: ModalType.RUN_ACTION,
    };

    const confirmed = yield call(requestModalConfirmationSaga, modalPayload);

    if (!confirmed) {
      yield put({
        type: ReduxActionTypes.RUN_ACTION_CANCELLED,
        payload: { id: actionId },
      });
      throw new UserCancelledActionExecutionError();
    }
  }
  yield call(handleExecuteJSFunctionSaga, {
    collectionName: collectionName,
    action: action,
    collectionId: collectionId,
  });
}

function* handleUpdateJSCollectionBody(
  actionPayload: ReduxAction<{ body: string; id: string; isReplay: boolean }>,
) {
  const jsCollection: JSCollection | undefined = yield select(
    getJSCollection,
    actionPayload.payload.id,
  );
  // @ts-expect-error: Object jsCollection is possibly undefined
  jsCollection["body"] = actionPayload.payload.body;
  try {
    if (jsCollection) {
      const response: JSCollectionCreateUpdateResponse = yield JSActionAPI.updateJSCollection(
        jsCollection,
      );
      const isValidResponse: boolean = yield validateResponse(response);
      if (isValidResponse) {
        // @ts-expect-error: response is of type unknown
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
  const pageResponse: FetchPageResponse = yield call(PageApi.fetchPage, {
    id: data.payload.refactorAction.pageId,
  });
  const isPageRequestSuccessful: boolean = yield validateResponse(pageResponse);
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
      const refactorResponse: ApiResponse = yield JSActionAPI.updateJSCollectionActionRefactor(
        requestData,
      );

      const isRefactorSuccessful: boolean = yield validateResponse(
        refactorResponse,
      );

      const currentPageId: string | undefined = yield select(getCurrentPageId);

      if (isRefactorSuccessful) {
        yield put({
          type: ReduxActionTypes.REFACTOR_JS_ACTION_NAME_SUCCESS,
          payload: { collectionId: data.payload.actionCollection.id },
        });
        if (currentPageId === data.payload.refactorAction.pageId) {
          yield updateCanvasWithDSL(
            // @ts-expect-error: response is of type unknown
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

function* setFunctionPropertySaga(
  data: ReduxAction<SetFunctionPropertyPayload>,
) {
  const { action, propertyName, value } = data.payload;
  if (!action.id) return;
  const actionId = action.id;
  if (propertyName === "executeOnLoad") {
    yield put({
      type: ReduxActionTypes.TOGGLE_FUNCTION_EXECUTE_ON_LOAD_INIT,
      payload: {
        collectionId: action.collectionId,
        actionId,
        shouldExecute: value,
      },
    });
    return;
  }
  yield put(updateJSFunction({ ...data.payload }));
}

function* handleUpdateJSFunctionPropertySaga(
  data: ReduxAction<SetFunctionPropertyPayload>,
) {
  const { action, propertyName, value } = data.payload;
  if (!action.id) return;
  const actionId = action.id;
  let collection: JSCollection;
  if (action.collectionId) {
    collection = yield select(getJSCollection, action.collectionId);

    try {
      const actions: JSAction[] = collection.actions;
      const updatedActions = actions.map((jsAction: JSAction) => {
        if (jsAction.id === actionId) {
          set(jsAction, propertyName, value);
          return jsAction;
        }
        return jsAction;
      });
      collection.actions = updatedActions;
      const response: ApiResponse<JSCollectionCreateUpdateResponse> = yield JSActionAPI.updateJSCollection(
        collection,
      );
      const isValidResponse: boolean = yield validateResponse(response);
      if (isValidResponse) {
        const fieldToBeUpdated = propertyName.replace(
          "actionConfiguration",
          "config",
        );
        AppsmithConsole.info({
          logType: LOG_TYPE.ACTION_UPDATE,
          text: "Configuration updated",
          source: {
            type: ENTITY_TYPE.JSACTION,
            name: collection.name + "." + action.name,
            id: actionId,
            propertyPath: fieldToBeUpdated,
          },
          state: {
            [fieldToBeUpdated]: value,
          },
        });
        yield put({
          type: ReduxActionTypes.UPDATE_JS_FUNCTION_PROPERTY_SUCCESS,
          payload: {
            collection,
          },
        });
      }
    } catch (e) {
      yield put({
        type: ReduxActionErrorTypes.UPDATE_JS_FUNCTION_PROPERTY_ERROR,
        payload: collection,
      });
    }
  }
}

function* toggleFunctionExecuteOnLoadSaga(
  action: ReduxAction<{
    collectionId: string;
    actionId: string;
    shouldExecute: boolean;
  }>,
) {
  try {
    const { actionId, collectionId, shouldExecute } = action.payload;
    const collection = shouldBeDefined<JSCollection>(
      yield select(getJSCollection, collectionId),
      `JS Collection not found for id - ${collectionId}`,
    );
    const jsAction = collection.actions.find(
      (action: JSAction) => actionId === action.id,
    );
    const response: ApiResponse = yield call(
      ActionAPI.toggleActionExecuteOnLoad,
      actionId,
      shouldExecute,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      AppsmithConsole.info({
        logType: LOG_TYPE.ACTION_UPDATE,
        text: "Configuration updated",
        source: {
          type: ENTITY_TYPE.JSACTION,
          name: collection.name + "." + jsAction?.name,
          id: actionId,
          propertyPath: "executeOnLoad",
        },
        state: {
          ["executeOnLoad"]: shouldExecute,
        },
      });
      yield put({
        type: ReduxActionTypes.TOGGLE_FUNCTION_EXECUTE_ON_LOAD_SUCCESS,
        payload: {
          actionId: actionId,
          collectionId: collectionId,
          executeOnLoad: shouldExecute,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.TOGGLE_ACTION_EXECUTE_ON_LOAD_ERROR,
      payload: error,
    });
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
      ReduxActionTypes.START_EXECUTE_JS_FUNCTION,
      handleStartExecuteJSFunctionSaga,
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
    takeEvery(ReduxActionTypes.SET_FUNCTION_PROPERTY, setFunctionPropertySaga),
    takeLatest(
      ReduxActionTypes.UPDATE_JS_FUNCTION_PROPERTY_INIT,
      handleUpdateJSFunctionPropertySaga,
    ),
    takeLatest(
      ReduxActionTypes.TOGGLE_FUNCTION_EXECUTE_ON_LOAD_INIT,
      toggleFunctionExecuteOnLoadSaga,
    ),
  ]);
}
