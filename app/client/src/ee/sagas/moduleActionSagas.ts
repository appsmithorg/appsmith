import { takeLatest, all, select, call, put } from "redux-saga/effects";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import {
  type Action,
  type ApiAction,
  PluginPackageName,
  PluginType,
} from "entities/Action";
import type {
  ActionData,
  ActionDataState,
} from "@appsmith/reducers/entityReducers/actionsReducer";
import {
  getActions,
  getDatasource,
  getJSCollection,
  getJSCollections,
  getPlugin,
} from "@appsmith/selectors/entitiesSelector";
import {
  createNewApiName,
  createNewJSFunctionName,
  createNewQueryName,
} from "utils/AppsmithUtils";
import { createDefaultApiActionPayload } from "sagas/ApiPaneSagas";
import {
  createActionRequest,
  updateActionData,
} from "actions/pluginActionActions";
import type { Datasource } from "entities/Datasource";
import { createDefaultActionPayloadWithPluginDefaults } from "sagas/ActionSagas";
import type { Plugin } from "api/PluginApi";
import {
  ActionParentEntityType,
  CreateNewActionKey,
} from "@appsmith/entities/Engine/actionHelpers";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import type {
  JSCollectionData,
  JSCollectionDataState,
} from "@appsmith/reducers/entityReducers/jsActionsReducer";
import { createDummyJSCollectionActions } from "utils/JSPaneUtils";
import type { CreateJSCollectionRequest } from "@appsmith/api/JSActionAPI";
import { generateDefaultJSObject } from "sagas/JSPaneSagas";
import { createJSCollectionRequest } from "actions/jsActionActions";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import type { ApiResponse } from "api/ApiResponses";
import ActionAPI from "api/ActionAPI";
import { validateResponse } from "sagas/ErrorSagas";
import JSActionAPI from "@appsmith/api/JSActionAPI";
import type { JSCollection } from "entities/JSCollection";
import { toast } from "design-system";
import {
  ERROR_ACTION_RENAME_FAIL,
  ERROR_JS_COLLECTION_RENAME_FAIL,
  createMessage,
} from "@appsmith/constants/messages";
import * as log from "loglevel";

export function* createNewAPIActionForPackageSaga(
  action: ReduxAction<{
    moduleId: string;
    from: EventLocation;
    apiType?: string;
  }>,
) {
  const {
    apiType = PluginPackageName.REST_API,
    from,
    moduleId,
  } = action.payload;

  if (moduleId) {
    const actions: ActionDataState = yield select(getActions);
    const newActionName = createNewApiName(
      actions,
      moduleId || "",
      CreateNewActionKey.MODULE,
    );
    // Note: Do NOT send pluginId on top level here.
    // It breaks embedded rest datasource flow.

    const createApiActionPayload: Partial<ApiAction> = yield call(
      createDefaultApiActionPayload,
      {
        apiType,
        from,
        newActionName,
      },
    );

    yield put(
      createActionRequest({
        ...createApiActionPayload,
        moduleId,
        contextType: ActionParentEntityType.MODULE,
      }), // We don't have recursive partial in typescript for now.
    );
  }
}

export function* createNewQueryActionForPackageSaga(
  action: ReduxAction<{
    moduleId: string;
    datasourceId: string;
    from: EventLocation;
  }>,
) {
  const { datasourceId, from, moduleId } = action.payload;
  const actions: ActionDataState = yield select(getActions);
  const datasource: Datasource = yield select(getDatasource, datasourceId);
  const plugin: Plugin = yield select(getPlugin, datasource?.pluginId);
  const newActionName =
    plugin?.type === PluginType.DB
      ? createNewQueryName(
          actions,
          moduleId || "",
          undefined,
          CreateNewActionKey.MODULE,
        )
      : createNewApiName(actions, moduleId || "", CreateNewActionKey.MODULE);

  const createActionPayload: Partial<Action> = yield call(
    createDefaultActionPayloadWithPluginDefaults,
    {
      datasourceId,
      from,
      newActionName,
    },
  );

  yield put(
    createActionRequest({
      ...createActionPayload,
      moduleId,
      contextType: ActionParentEntityType.MODULE,
    }),
  );
}

export function* createNewSActionForPackageSaga(
  action: ReduxAction<{ moduleId: string; from: EventLocation }>,
) {
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const { from, moduleId } = action.payload;

  if (moduleId) {
    const jsActions: JSCollectionDataState = yield select(getJSCollections);
    const moduleJsActions = jsActions.filter(
      (a: JSCollectionData) => a.config.moduleId === moduleId,
    );
    const newJSCollectionName = createNewJSFunctionName(
      moduleJsActions,
      moduleId,
      CreateNewActionKey.MODULE,
    );
    const { actions, body, variables } =
      createDummyJSCollectionActions(workspaceId);

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
          moduleId,
          contextType: ActionParentEntityType.MODULE,
        },
      }),
    );
  }
}

export function* refactorJSObjectName(
  id: string,
  moduleId: string,
  oldName: string,
  newName: string,
) {
  // call to refactor action
  const refactorResponse: ApiResponse =
    yield JSActionAPI.updateJSCollectionOrActionName({
      actionCollectionId: id,
      oldName: oldName,
      newName: newName,
      moduleId,
      contextType: ActionParentEntityType.MODULE,
    });

  const isRefactorSuccessful: boolean =
    yield validateResponse(refactorResponse);

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
  }
}

export function* refactorActionNameForPackage(
  id: string,
  moduleId: string,
  oldName: string,
  newName: string,
) {
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.REFACTOR_ACTION_NAME,
    { actionId: id },
  );

  // call to refactor action
  const refactorResponse: ApiResponse = yield ActionAPI.updateActionName({
    actionId: id,
    oldName: oldName,
    newName: newName,
    moduleId,
    contextType: ActionParentEntityType.MODULE,
  });

  const isRefactorSuccessful: boolean =
    yield validateResponse(refactorResponse);

  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.REFACTOR_ACTION_NAME,
    { isSuccess: isRefactorSuccessful },
  );
  if (isRefactorSuccessful) {
    yield put({
      type: ReduxActionTypes.SAVE_ACTION_NAME_SUCCESS,
      payload: {
        actionId: id,
      },
    });
    yield put(
      updateActionData([
        {
          entityName: newName,
          dataPath: "data",
          data: undefined,
          dataPathRef: `${oldName}.data`,
        },
      ]),
    );
  }
}

export function* saveActionNameForPackageSaga(
  action: ReduxAction<{ id: string; name: string }>,
) {
  const { id, name } = action.payload;
  const actions: ActionDataState = yield select(getActions);
  const actionToBeUpdated: ActionData | undefined = actions.find(
    (action) => action.config.id === id,
  );
  try {
    yield refactorActionNameForPackage(
      id,
      actionToBeUpdated?.config?.moduleId || "",
      actionToBeUpdated?.config.name || "",
      name,
    );
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_ACTION_NAME_ERROR,
      payload: {
        actionId: action.payload.id,
        oldName: actionToBeUpdated?.config.name,
      },
    });
    toast.show(createMessage(ERROR_ACTION_RENAME_FAIL, action.payload.name), {
      kind: "error",
    });
    log.error(e);
  }
}

export function* saveJSObjectNameForPackageSaga(
  action: ReduxAction<{ id: string; name: string }>,
) {
  const { id, name } = action.payload;
  const jsActions: JSCollectionDataState = yield select(getJSCollections);
  const jsActionToBeUpdated: JSCollectionData | undefined = jsActions.find(
    (jsaction) => jsaction.config.id === id,
  );

  try {
    yield refactorActionNameForPackage(
      id,
      jsActionToBeUpdated?.config.moduleId || "",
      jsActionToBeUpdated?.config.name || "",
      name,
    );
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_JS_COLLECTION_NAME_ERROR,
      payload: {
        actionId: action.payload.id,
        oldName: jsActionToBeUpdated?.config.name,
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

export default function* modulesSaga() {
  yield all([
    takeLatest(
      ReduxActionTypes.CREATE_NEW_API_ACTION_FOR_PACKAGE,
      createNewAPIActionForPackageSaga,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_NEW_QUERY_ACTION_FOR_PACKAGE,
      createNewQueryActionForPackageSaga,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_NEW_JS_ACTION_FOR_PACKAGE,
      createNewSActionForPackageSaga,
    ),
    takeLatest(
      ReduxActionTypes.SAVE_ACTION_NAME_FOR_PACKAGE_INIT,
      saveActionNameForPackageSaga,
    ),
    takeLatest(
      ReduxActionTypes.SAVE_JS_OBJECT_NAME_FOR_PACKAGE_INIT,
      saveJSObjectNameForPackageSaga,
    ),
  ]);
}
