import { takeLatest, all, select, call, put } from "redux-saga/effects";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import {
  type Action,
  type ApiAction,
  PluginPackageName,
  PluginType,
} from "entities/Action";
import type { ActionDataState } from "@appsmith/reducers/entityReducers/actionsReducer";
import {
  getActions,
  getDatasource,
  getJSCollections,
  getPlugin,
} from "@appsmith/selectors/entitiesSelector";
import {
  createNewApiName,
  createNewJSFunctionName,
  createNewQueryName,
} from "utils/AppsmithUtils";
import { createDefaultApiActionPayload } from "sagas/ApiPaneSagas";
import { createActionRequest } from "actions/pluginActionActions";
import type { Datasource } from "entities/Datasource";
import { createDefaultActionPayloadWithPluginDefaults } from "sagas/ActionSagas";
import type { Plugin } from "api/PluginApi";
import {
  ActionContextType,
  CreateNewActionKey,
} from "@appsmith/entities/DataTree/types";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import type {
  JSCollectionData,
  JSCollectionDataState,
} from "@appsmith/reducers/entityReducers/jsActionsReducer";
import { createDummyJSCollectionActions } from "utils/JSPaneUtils";
import type { CreateJSCollectionRequest } from "@appsmith/api/JSActionAPI";
import { generateDefaultJSObject } from "sagas/JSPaneSagas";
import { createJSCollectionRequest } from "actions/jsActionActions";

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
        contextType: ActionContextType.MODULE,
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
      contextType: ActionContextType.MODULE,
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
          contextType: ActionContextType.MODULE,
        },
      }),
    );
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
  ]);
}
