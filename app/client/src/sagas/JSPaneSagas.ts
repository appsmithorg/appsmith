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
import { parseJSCollection, executeFunction } from "./EvaluationsSaga";
import { getJSCollectionIdFromURL } from "pages/Editor/Explorer/helpers";
import {
  getDifferenceInJSCollection,
  pushLogsForObjectUpdate,
} from "../utils/JSPaneUtils";
import JSActionAPI from "../api/JSActionAPI";
import ActionAPI from "api/ActionAPI";
import {
  updateJSCollectionSuccess,
  addJSObjectAction,
  updateJSObjectAction,
  deleteJSObjectAction,
  refactorJSCollectionAction,
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
} from "constants/messages";
import { validateResponse } from "./ErrorSagas";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE, PLATFORM_ERROR } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import PageApi from "api/PageApi";
import { updateCanvasWithDSL } from "sagas/PageSagas";
import { ActionDescription } from "entities/DataTree/actionTriggers";
import { executeActionTriggers } from "sagas/ActionExecution/ActionExecutionSagas";
export const JS_PLUGIN_PACKAGE_NAME = "js-plugin";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

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
    const sampleBody =
      "export default {\n\tresults: [],\n\trun: () => {\n\t\t//write code here\n\t}\n}";
    const sampleActions = [
      {
        name: "run",
        pageId,
        organizationId,
        executeOnLoad: false,
        actionConfiguration: {
          body: "() => {\n\t\t//write code here\n\t}",
          isAsync: false,
          timeoutInMilliseconds: 0,
          jsArguments: [],
        },
      },
    ];
    yield put(
      createJSCollectionRequest({
        name: newJSCollectionName,
        pageId,
        organizationId,
        pluginId,
        body: sampleBody,
        variables: [
          {
            name: "results",
            value: [],
          },
        ],
        actions: sampleActions,
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

function* handleParseUpdateJSCollection(actionPayload: { body: string }) {
  const body = actionPayload.body;
  const jsActionId = getJSCollectionIdFromURL();
  const organizationId: string = yield select(getCurrentOrgId);
  if (jsActionId) {
    const jsAction: JSCollection = yield select(getJSCollection, jsActionId);
    const jsActionTobeUpdated = JSON.parse(JSON.stringify(jsAction));
    let newActions: Partial<JSAction>[] = [];
    let updateActions: JSAction[] = [];
    let deletedActions: JSAction[] = [];
    jsActionTobeUpdated.body = body;

    const parsedBody = yield call(parseJSCollection, body, jsAction);
    if (parsedBody) {
      const data = getDifferenceInJSCollection(parsedBody, jsAction);
      if (parsedBody.variables) {
        jsActionTobeUpdated.variables = parsedBody.variables;
      }
      if (data.nameChangedActions.length) {
        for (let i = 0; i < data.nameChangedActions.length; i++) {
          yield put(
            refactorJSCollectionAction({
              actionId: data.nameChangedActions[i].id,
              collectionId: data.nameChangedActions[i].collectionId || "",
              pageId: data.nameChangedActions[i].pageId,
              oldName: data.nameChangedActions[i].oldName,
              newName: data.nameChangedActions[i].newName,
            }),
          );
        }
      }
      if (data.newActions.length) {
        newActions = data.newActions;
        for (let i = 0; i < data.newActions.length; i++) {
          jsActionTobeUpdated.actions.push({
            ...data.newActions[i],
            organizationId: organizationId,
          });
        }
        yield put(
          addJSObjectAction({
            jsAction: jsAction,
            subActions: data.newActions,
          }),
        );
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
        jsActionTobeUpdated.actions = changedActions;
        yield put(
          updateJSObjectAction({
            jsAction: jsAction,
            subActions: data.updateActions,
          }),
        );
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
        jsActionTobeUpdated.actions = nonDeletedActions;
        yield put(
          deleteJSObjectAction({
            jsAction: jsAction,
            subActions: data.deletedActions,
          }),
        );
      }
    }
    return {
      jsCollection: jsActionTobeUpdated,
      newActions: newActions,
      updatedActions: updateActions,
      deletedActions: deletedActions,
    };
  }
}

function* handleUpdateJSCollection(
  actionPayload: ReduxAction<{ body: string }>,
) {
  let jsAction = {};
  const jsActionId = getJSCollectionIdFromURL();
  if (jsActionId) {
    jsAction = yield select(getJSCollection, jsActionId);
  }
  try {
    const { body } = actionPayload.payload;
    const {
      deletedActions,
      jsCollection,
      newActions,
      updatedActions,
    } = yield call(handleParseUpdateJSCollection, { body: body });
    if (jsCollection) {
      const response = yield JSActionAPI.updateJSCollection(jsCollection);
      const isValidResponse = yield validateResponse(response);
      if (isValidResponse) {
        if (newActions.length) {
          pushLogsForObjectUpdate(
            newActions,
            jsCollection,
            createMessage(JS_FUNCTION_CREATE_SUCCESS),
          );
        }
        if (updatedActions.length) {
          pushLogsForObjectUpdate(
            updatedActions,
            jsCollection,
            createMessage(JS_FUNCTION_UPDATE_SUCCESS),
          );
        }
        if (deletedActions.length) {
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
    const { result, triggers } = yield call(
      executeFunction,
      collectionName,
      action,
    );
    if (triggers && triggers.length) {
      yield all(
        triggers.map((trigger: ActionDescription) =>
          call(executeActionTriggers, trigger, EventType.ON_CLICK, {
            source: {
              id: action.collectionId || "",
              name: data.payload.collectionName,
            },
          }),
        ),
      );
    }

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

function* handleRefactorJSActionNameSaga(
  data: ReduxAction<{
    actionId: string;
    collectionId: string;
    pageId: string;
    oldName: string;
    newName: string;
  }>,
) {
  const pageResponse = yield call(PageApi.fetchPage, {
    id: data.payload.pageId,
  });
  const isPageRequestSuccessful = yield validateResponse(pageResponse);
  if (isPageRequestSuccessful) {
    // get the layoutId from the page response
    const layoutId = pageResponse.data.layouts[0].id;
    // call to refactor action
    try {
      const refactorResponse = yield ActionAPI.updateActionName({
        layoutId,
        collectionId: data.payload.collectionId,
        pageId: data.payload.pageId,
        oldName: data.payload.oldName,
        newName: data.payload.newName,
        actionId: data.payload.actionId,
      });

      const isRefactorSuccessful = yield validateResponse(refactorResponse);

      const currentPageId = yield select(getCurrentPageId);

      if (isRefactorSuccessful) {
        if (currentPageId === data.payload.pageId) {
          yield updateCanvasWithDSL(
            refactorResponse.data,
            data.payload.pageId,
            layoutId,
          );
        }
      }
    } catch (error) {
      yield put({
        type: ReduxActionErrorTypes.REFACTOR_JS_ACTION_NAME_ERROR,
        payload: { error },
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
    debounce(
      100,
      ReduxActionTypes.UPDATE_JS_ACTION_INIT,
      handleUpdateJSCollection,
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
  ]);
}
