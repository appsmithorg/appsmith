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
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentLayoutId,
  getCurrentPageId,
  getIsSavingEntity,
} from "selectors/editorSelectors";
import {
  getJSCollection,
  getJSCollections,
} from "ee/selectors/entitiesSelector";
import type {
  JSCollectionData,
  JSCollectionDataState,
} from "ee/reducers/entityReducers/jsActionsReducer";
import { createNewJSFunctionName } from "utils/AppsmithUtils";
import { getQueryParams } from "utils/URLUtils";
import type { JSCollection, JSAction, Variable } from "entities/JSCollection";
import { createJSCollectionRequest } from "actions/jsActionActions";
import history from "utils/history";
import { executeJSFunction } from "./EvaluationsSaga";
import { getJSCollectionIdFromURL } from "ee/pages/Editor/Explorer/helpers";
import type { JSUpdate } from "utils/JSPaneUtils";
import {
  getDifferenceInJSCollection,
  pushLogsForObjectUpdate,
  createDummyJSCollectionActions,
  createSingleFunctionJsCollection,
} from "utils/JSPaneUtils";
import type {
  CreateJSCollectionRequest,
  JSCollectionCreateUpdateResponse,
  RefactorAction,
  SetFunctionPropertyPayload,
} from "ee/api/JSActionAPI";
import JSActionAPI from "ee/api/JSActionAPI";
import ActionAPI from "api/ActionAPI";
import {
  updateJSCollectionSuccess,
  updateJSCollectionBodySuccess,
  updateJSFunction,
  executeJSFunctionInit,
  setJsPaneDebuggerState,
  createNewJSCollection,
  jsSaveActionComplete,
  jsSaveActionStart,
  refactorJSCollectionAction,
} from "actions/jsPaneActions";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { getPluginIdOfPackageName } from "sagas/selectors";
import { PluginPackageName, PluginType } from "entities/Action";
import {
  createMessage,
  ERROR_JS_COLLECTION_RENAME_FAIL,
  JS_EXECUTION_SUCCESS,
  JS_EXECUTION_FAILURE,
  JS_FUNCTION_CREATE_SUCCESS,
  JS_FUNCTION_DELETE_SUCCESS,
} from "ee/constants/messages";
import { validateResponse } from "./ErrorSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE, PLATFORM_ERROR } from "ee/entities/AppsmithConsole/utils";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { updateCanvasWithDSL } from "ee/sagas/PageSagas";
import { set } from "lodash";
import { updateReplayEntity } from "actions/pageActions";
import { jsCollectionIdURL } from "ee/RouteBuilder";
import type { ApiResponse } from "api/ApiResponses";
import { ModalType } from "reducers/uiReducers/modalActionReducer";
import { requestModalConfirmationSaga } from "sagas/UtilSagas";
import { UserCancelledActionExecutionError } from "sagas/ActionExecution/errorUtils";
import type { EventLocation } from "ee/utils/analyticsUtilTypes";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { checkAndLogErrorsIfCyclicDependency } from "./helper";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import {
  getJSActionPathNameToDisplay,
  isBrowserExecutionAllowed,
} from "ee/utils/actionExecutionUtils";
import { getJsPaneDebuggerState } from "selectors/jsPaneSelectors";
import { logMainJsActionExecution } from "ee/utils/analyticsHelpers";
import { getFocusablePropertyPaneField } from "selectors/propertyPaneSelectors";
import { getIsSideBySideEnabled } from "selectors/ideSelectors";
import { setIdeEditorViewMode } from "actions/ideActions";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { updateJSCollectionAPICall } from "ee/sagas/ApiCallerSagas";
import { convertToBasePageIdSelector } from "selectors/pageListSelectors";

export interface GenerateDefaultJSObjectProps {
  name: string;
  workspaceId: string;
  body: string;
  actions: Partial<JSAction>[];
  variables: Variable[];
}

const CONSOLE_DOT_LOG_INVOCATION_REGEX =
  /console.log[.call | .apply]*\s*\(.*?\)/gm;

function* handleCreateNewJsActionSaga(
  action: ReduxAction<{
    pageId: string;
    from: EventLocation;
    functionName?: string;
  }>,
) {
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const applicationId: string = yield select(getCurrentApplicationId);
  const { from, functionName, pageId } = action.payload;

  if (pageId) {
    const jsActions: JSCollectionDataState = yield select(getJSCollections);
    const pageJSActions = jsActions.filter(
      (a: JSCollectionData) => a.config.pageId === pageId,
    );
    const newJSCollectionName = createNewJSFunctionName(pageJSActions, pageId);

    const { actions, body, variables } = functionName
      ? createSingleFunctionJsCollection(workspaceId, functionName, { pageId })
      : createDummyJSCollectionActions(workspaceId, {
          pageId,
        });

    const defaultJSObject: CreateJSCollectionRequest =
      yield generateDefaultJSObject({
        name: newJSCollectionName,
        workspaceId,
        actions,
        body,
        variables,
      });

    yield put(
      createJSCollectionRequest({
        from: from,
        request: {
          ...defaultJSObject,
          pageId,
          applicationId,
        },
      }),
    );
  }
}

export function* generateDefaultJSObject({
  actions,
  body,
  name,
  variables,
  workspaceId,
}: GenerateDefaultJSObjectProps) {
  const pluginId: string = yield select(
    getPluginIdOfPackageName,
    PluginPackageName.JS,
  );

  return {
    name,
    workspaceId,
    pluginId,
    body: body,
    variables,
    actions: actions,
    pluginType: PluginType.JS,
  };
}

function* handleJSCollectionCreatedSaga(
  actionPayload: ReduxAction<JSCollection>,
) {
  const { baseId: baseCollectionId, pageId } = actionPayload.payload;
  const basePageId: string = yield select(convertToBasePageIdSelector, pageId);

  history.push(
    jsCollectionIdURL({
      basePageId,
      baseCollectionId,
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

    if (parsedBody && !!jsAction) {
      const jsActionTobeUpdated = JSON.parse(JSON.stringify(jsAction));
      const data = getDifferenceInJSCollection(parsedBody, jsAction);

      if (data.nameChangedActions.length) {
        for (let i = 0; i < data.nameChangedActions.length; i++) {
          yield put(
            refactorJSCollectionAction({
              refactorAction: {
                actionId: data.nameChangedActions[i].id,
                collectionName: jsAction.name,
                pageId: data.nameChangedActions[i].pageId || "",
                moduleId: data.nameChangedActions[i].moduleId,
                workflowId: data.nameChangedActions[i].workflowId,
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
    const { deletedActions, jsCollection, newActions } = data;

    if (jsCollection) {
      yield put(jsSaveActionStart({ id: jsCollection.id }));
      const response: JSCollectionCreateUpdateResponse = yield call(
        updateJSCollectionAPICall,
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
  } finally {
    yield put(jsSaveActionComplete({ id: data.jsCollection.id }));
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
    yield put({
      type: ReduxActionErrorTypes.SAVE_JS_COLLECTION_NAME_ERROR,
      payload: {
        actionId,
        show: true,
        error: {
          message: createMessage(ERROR_JS_COLLECTION_RENAME_FAIL, ""),
        },
      },
    });

    return;
  }

  if (actionObj.pluginType === PluginType.JS) {
    const params = getQueryParams();

    if (params.editName) {
      params.editName = "false";
    }

    const basePageId: string = yield select(
      convertToBasePageIdSelector,
      actionObj.pageId,
    );

    history.push(
      jsCollectionIdURL({
        basePageId,
        baseCollectionId: actionObj.baseId,
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
  onPageLoad: boolean;
  openDebugger?: boolean;
}) {
  const { action, collection, onPageLoad, openDebugger = false } = data;
  const { id: collectionId } = collection;
  const actionId = action.id;

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
    const localExecutionAllowed = isBrowserExecutionAllowed(collection, action);
    let isDirty = false;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = null;

    if (localExecutionAllowed) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: { isDirty: false; result: any } = yield call(
        executeJSFunction,
        action,
        collection,
        onPageLoad,
      );

      result = response.result;
      isDirty = response.isDirty;
    }
    // open response tab in debugger on runnning or page load js action.

    if (doesURLPathContainCollectionId || openDebugger) {
      yield put(setJsPaneDebuggerState({ open: true }));

      const { selectedTab: debuggerSelectedTab } = yield select(
        getJsPaneDebuggerState,
      );

      yield put(
        setJsPaneDebuggerState({
          selectedTab: debuggerSelectedTab || DEBUGGER_TAB_KEYS.RESPONSE_TAB,
        }),
      );
    }

    if (!!collection.isMainJSCollection)
      logMainJsActionExecution(actionId, true, collectionId, isDirty);

    yield put({
      type: ReduxActionTypes.EXECUTE_JS_FUNCTION_SUCCESS,
      payload: {
        collectionId,
        actionId,
        isDirty,
      },
    });

    if (localExecutionAllowed) {
      AppsmithConsole.info({
        text: createMessage(JS_EXECUTION_SUCCESS),
        source: {
          type: ENTITY_TYPE.JSACTION,
          name: jsActionPathNameToDisplay,
          id: collectionId,
        },
        state: { response: result },
      });
    } else {
      yield put({
        type: ReduxActionTypes.JS_ACTION_REMOTE_EXECUTION_INIT,
        payload: {
          collectionId,
        },
      });
    }
  } catch (error) {
    // open response tab in debugger on runnning js action.
    if (doesURLPathContainCollectionId) {
      yield put(
        setJsPaneDebuggerState({
          open: true,
          selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
        }),
      );
    }

    if (!!collection.isMainJSCollection)
      logMainJsActionExecution(actionId, false, collectionId, false);

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

// This gets called on pressing "Run" button in JS code editor
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
    onPageLoad: false,
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: ApiResponse<any> =
        yield JSActionAPI.updateJSCollectionBody(
          jsCollection.id,
          jsCollection.body,
        );
      const isValidResponse: boolean = yield validateResponse(response);

      if (isValidResponse) {
        // since server is not sending the info about whether the js collection is main or not
        // we are retaining it manually
        const updatedJSCollection: JSCollection = {
          ...jsCollection,
          isMainJSCollection: !!jsCollection.isMainJSCollection,
        };

        yield put(
          updateJSCollectionBodySuccess({
            data: updatedJSCollection,
          }),
        );
        checkAndLogErrorsIfCyclicDependency(updatedJSCollection.errorReports);
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
  const { actionCollection, refactorAction } = data.payload;
  const { pageId } = refactorAction;
  const layoutId: string | undefined = yield select(getCurrentLayoutId);

  if (!pageId || !layoutId) {
    return;
  }

  const requestData = {
    ...refactorAction,
    layoutId,
    actionCollection: actionCollection,
  };

  // call to refactor action
  try {
    yield put(jsSaveActionStart({ id: actionCollection.id }));
    const refactorResponse: ApiResponse =
      yield JSActionAPI.updateJSCollectionActionRefactor(requestData);

    const isRefactorSuccessful: boolean =
      yield validateResponse(refactorResponse);

    const currentPageId: string | undefined = yield select(getCurrentPageId);

    if (isRefactorSuccessful) {
      yield put({
        type: ReduxActionTypes.REFACTOR_JS_ACTION_NAME_SUCCESS,
        payload: { collectionId: actionCollection.id },
      });

      if (currentPageId === refactorAction.pageId) {
        yield updateCanvasWithDSL(
          // @ts-expect-error: response is of type unknown
          refactorResponse.data,
          refactorAction.pageId,
          layoutId,
        );
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.REFACTOR_JS_ACTION_NAME_ERROR,
      payload: { collectionId: actionCollection.id },
    });
  } finally {
    yield put(jsSaveActionComplete({ id: actionCollection.id }));
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
        yield call(updateJSCollectionAPICall, collection);

      const isValidResponse: boolean = yield validateResponse(response);

      if (isValidResponse) {
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
    const response: ApiResponse = yield call(
      ActionAPI.toggleActionExecuteOnLoad,
      actionId,
      shouldExecute,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
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

function* handleCreateNewJSFromActionCreator(
  action: ReduxAction<(bindingValue: string) => void>,
) {
  // We name the newly created function similar to the property the function will be called from
  // eg: Button1OnClick
  const currentFocusedProperty: string = yield select(
    getFocusablePropertyPaneField,
  );
  const functionName = currentFocusedProperty.split(".").join("");

  // Side by Side ramp. Switch to SplitScreen mode to allow user to edit JS function
  // created while having context of the canvas
  const isSideBySideEnabled: boolean = yield select(getIsSideBySideEnabled);

  if (isSideBySideEnabled) {
    yield put(setIdeEditorViewMode(EditorViewMode.SplitScreen));
  }

  // Create the JS Object with the given function name
  const pageId: string = yield select(getCurrentPageId);

  yield put(createNewJSCollection(pageId, "ACTION_SELECTOR", functionName));

  // Wait for it to be created
  const JSAction: ReduxAction<JSCollection> = yield take(
    ReduxActionTypes.CREATE_JS_ACTION_SUCCESS,
  );

  // Call the payload callback with the binding value of the new function created
  const bindingValue = JSAction.payload.name + "." + functionName;

  action.payload(bindingValue);
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
    takeLatest(
      ReduxActionTypes.CREATE_NEW_JS_FROM_ACTION_CREATOR,
      handleCreateNewJSFromActionCreator,
    ),
  ]);
}
