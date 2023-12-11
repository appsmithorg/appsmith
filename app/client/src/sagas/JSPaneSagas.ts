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
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsSavingEntity,
} from "selectors/editorSelectors";
import {
  getJSCollection,
  getJSCollections,
} from "@appsmith/selectors/entitiesSelector";
import type {
  JSCollectionData,
  JSCollectionDataState,
} from "reducers/entityReducers/jsActionsReducer";
import { createNewJSFunctionName } from "utils/AppsmithUtils";
import { getQueryParams } from "utils/URLUtils";
import type { JSCollection, JSAction } from "entities/JSCollection";
import { createJSCollectionRequest } from "actions/jsActionActions";
import history from "utils/history";
import { executeJSFunction } from "./EvaluationsSaga";
import { getJSCollectionIdFromURL } from "@appsmith/pages/Editor/Explorer/helpers";
import type { JSUpdate } from "utils/JSPaneUtils";
import {
  getDifferenceInJSCollection,
  pushLogsForObjectUpdate,
  createDummyJSCollectionActions,
} from "utils/JSPaneUtils";
import type {
  JSCollectionCreateUpdateResponse,
  RefactorAction,
  SetFunctionPropertyPayload,
} from "@appsmith/api/JSActionAPI";
import JSActionAPI from "@appsmith/api/JSActionAPI";
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
import { PluginPackageName, PluginType } from "entities/Action";
import {
  createMessage,
  ERROR_JS_COLLECTION_RENAME_FAIL,
  JS_EXECUTION_SUCCESS,
  JS_EXECUTION_FAILURE,
  JS_FUNCTION_CREATE_SUCCESS,
  JS_FUNCTION_DELETE_SUCCESS,
  JS_FUNCTION_UPDATE_SUCCESS,
  JS_EXECUTION_SUCCESS_TOASTER,
} from "@appsmith/constants/messages";
import { validateResponse } from "./ErrorSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE, PLATFORM_ERROR } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { FetchPageRequest, FetchPageResponse } from "api/PageApi";
import PageApi from "api/PageApi";
import { updateCanvasWithDSL } from "@appsmith/sagas/PageSagas";
import { set } from "lodash";
import { updateReplayEntity } from "actions/pageActions";
import { jsCollectionIdURL } from "@appsmith/RouteBuilder";
import type { ApiResponse } from "api/ApiResponses";
import { shouldBeDefined } from "utils/helpers";
import { ModalType } from "reducers/uiReducers/modalActionReducer";
import { requestModalConfirmationSaga } from "sagas/UtilSagas";
import { UserCancelledActionExecutionError } from "sagas/ActionExecution/errorUtils";
import { APP_MODE } from "entities/App";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { checkAndLogErrorsIfCyclicDependency } from "./helper";
import { toast } from "design-system";
import { setDebuggerSelectedTab, showDebugger } from "actions/debuggerActions";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import { getDebuggerSelectedTab } from "selectors/debuggerSelectors";
import { getIsServerDSLMigrationsEnabled } from "selectors/pageSelectors";
import {
  getJSActionNameToDisplay,
  getJSActionPathNameToDisplay,
} from "@appsmith/utils/actionExecutionUtils";

const CONSOLE_DOT_LOG_INVOCATION_REGEX =
  /console.log[.call | .apply]*\s*\(.*?\)/gm;

function* handleCreateNewJsActionSaga(
  action: ReduxAction<{ pageId: string; from: EventLocation }>,
) {
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const applicationId: string = yield select(getCurrentApplicationId);
  const { from, pageId } = action.payload;
  const pluginId: string = yield select(
    getPluginIdOfPackageName,
    PluginPackageName.JS,
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
        from: from,
        request: {
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
        },
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
          newActions.forEach((action) => {
            AnalyticsUtil.logEvent("JS_OBJECT_FUNCTION_ADDED", {
              name: action.name,
              jsObjectName: jsAction.name,
            });
          });
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

export function* makeUpdateJSCollection(
  action: ReduxAction<Record<string, JSUpdate>>,
) {
  const jsUpdates: Record<string, JSUpdate> = action.payload || {};

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
      const response: JSCollectionCreateUpdateResponse =
        yield JSActionAPI.updateJSCollection(jsCollection);
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
            AppsmithConsole.deleteErrors([
              { id: `${jsCollection.id}-${action.id}` },
            ]),
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
    toast.show(createMessage(ERROR_JS_COLLECTION_RENAME_FAIL, ""), {
      kind: "error",
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

//isExecuteJSFunc is used to check if the function is called on the JS Function execution.
export function* handleExecuteJSFunctionSaga(data: {
  action: JSAction;
  collection: JSCollection;
  isExecuteJSFunc: boolean;
  openDebugger?: boolean;
}) {
  const { action, collection, isExecuteJSFunc, openDebugger = false } = data;
  const { id: collectionId } = collection;
  const actionId = action.id;
  const appMode: APP_MODE = yield select(getAppMode);
  yield put(
    executeJSFunctionInit({
      collection,
      action,
    }),
  );
  const isEntitySaving: boolean = yield select(getIsSavingEntity);
  /**
   * Only start executing when no entity in the application is saving
   * This ensures that execution doesn't get carried out on stale values
   * This includes other entities which might be bound in the JS Function
   */
  if (isEntitySaving) {
    yield take(ReduxActionTypes.ENTITY_UPDATE_SUCCESS);
  }

  const doesURLPathContainCollectionId =
    window.location.pathname.includes(collectionId);

  const jsActionPathNameToDisplay = getJSActionPathNameToDisplay(
    action,
    collection,
  );

  try {
    const { isDirty, result } = yield call(
      executeJSFunction,
      action,
      collection,
    );
    // open response tab in debugger on runnning or page load js action.

    if (doesURLPathContainCollectionId || openDebugger) {
      yield put(showDebugger(true));

      const debuggerSelectedTab: ReturnType<typeof getDebuggerSelectedTab> =
        yield select(getDebuggerSelectedTab);

      yield put(
        setDebuggerSelectedTab(
          debuggerSelectedTab || DEBUGGER_TAB_KEYS.RESPONSE_TAB,
        ),
      );
    }
    yield put({
      type: ReduxActionTypes.EXECUTE_JS_FUNCTION_SUCCESS,
      payload: {
        collectionId,
        actionId,
        isDirty,
      },
    });

    const jsActionNameToDisplay = getJSActionNameToDisplay(action);
    AppsmithConsole.info({
      text: createMessage(JS_EXECUTION_SUCCESS),
      source: {
        type: ENTITY_TYPE.JSACTION,
        name: jsActionPathNameToDisplay,
        id: collectionId,
      },
      state: { response: result },
    });
    const showSuccessToast = appMode === APP_MODE.EDIT && !isDirty;

    if (
      showSuccessToast &&
      isExecuteJSFunc &&
      !doesURLPathContainCollectionId
    ) {
      toast.show(
        createMessage(JS_EXECUTION_SUCCESS_TOASTER, jsActionNameToDisplay),
        {
          kind: "success",
        },
      );
    }
  } catch (error) {
    // open response tab in debugger on runnning js action.
    if (doesURLPathContainCollectionId) {
      yield put(showDebugger(true));
      yield put(setDebuggerSelectedTab(DEBUGGER_TAB_KEYS.RESPONSE_TAB));
    }
    AppsmithConsole.addErrors([
      {
        payload: {
          id: actionId,
          logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
          text: createMessage(JS_EXECUTION_FAILURE),
          source: {
            type: ENTITY_TYPE.JSACTION,
            name: jsActionPathNameToDisplay,
            id: collectionId,
          },
          messages: [
            {
              message: {
                name: (error as Error).name,
                message: (error as Error).message,
              },
              type: PLATFORM_ERROR.PLUGIN_EXECUTION,
            },
          ],
        },
      },
    ]);
  }
}

export function* handleStartExecuteJSFunctionSaga(
  data: ReduxAction<{
    action: JSAction;
    collection: JSCollection;
    from: EventLocation;
    openDebugger?: boolean;
  }>,
) {
  const { action, collection, from, openDebugger } = data.payload;
  const actionId = action.id;
  const JSActionPathName = getJSActionPathNameToDisplay(action, collection);
  if (action.confirmBeforeExecute) {
    const modalPayload = {
      name: JSActionPathName,
      modalOpen: true,
      modalType: ModalType.RUN_ACTION,
    };

    const confirmed: boolean = yield call(
      requestModalConfirmationSaga,
      modalPayload,
    );

    if (!confirmed) {
      yield put({
        type: ReduxActionTypes.RUN_ACTION_CANCELLED,
        payload: { id: actionId },
      });
      throw new UserCancelledActionExecutionError();
    }
  }

  AnalyticsUtil.logEvent("JS_OBJECT_FUNCTION_RUN", {
    name: action.name,
    num_params: action.actionConfiguration?.jsArguments?.length,
    from,
    consoleStatements:
      action.actionConfiguration?.body?.match(CONSOLE_DOT_LOG_INVOCATION_REGEX)
        ?.length || 0,
  });

  yield call(handleExecuteJSFunctionSaga, {
    action,
    collection,
    isExecuteJSFunc: false,
    openDebugger,
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
      const response: JSCollectionCreateUpdateResponse =
        yield JSActionAPI.updateJSCollection(jsCollection);
      const isValidResponse: boolean = yield validateResponse(response);
      if (isValidResponse) {
        // @ts-expect-error: response is of type unknown
        yield put(updateJSCollectionBodySuccess({ data: response?.data }));
        checkAndLogErrorsIfCyclicDependency(
          (response.data as JSCollection).errorReports,
        );
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
  const isServerDSLMigrationsEnabled = select(getIsServerDSLMigrationsEnabled);
  const params: FetchPageRequest = { id: data.payload.refactorAction.pageId };
  if (isServerDSLMigrationsEnabled) {
    params.migrateDSL = true;
  }
  const pageResponse: FetchPageResponse = yield call(PageApi.fetchPage, params);
  const isPageRequestSuccessful: boolean = yield validateResponse(pageResponse);
  if (isPageRequestSuccessful) {
    // get the layoutId from the page response
    const layoutId = pageResponse.data.layouts[0].id;
    const requestData = {
      ...data.payload.refactorAction,
      layoutId: layoutId,
      actionCollection: data.payload.actionCollection,
    };
    // call to refactor action
    try {
      const refactorResponse: ApiResponse =
        yield JSActionAPI.updateJSCollectionActionRefactor(requestData);

      const isRefactorSuccessful: boolean =
        yield validateResponse(refactorResponse);

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
      const response: ApiResponse<JSCollectionCreateUpdateResponse> =
        yield JSActionAPI.updateJSCollection(collection);
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
            id: action.collectionId,
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
          id: collectionId,
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
