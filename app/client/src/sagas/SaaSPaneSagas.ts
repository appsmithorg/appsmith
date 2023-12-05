import { all, put, select, takeEvery } from "redux-saga/effects";
import type {
  ApplicationPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import history from "utils/history";
import {
  getGenerateCRUDEnabledPluginMap,
  getPlugin,
} from "@appsmith/selectors/entitiesSelector";
import type { Action } from "entities/Action";
import { PluginType } from "entities/Action";
import type { GenerateCRUDEnabledPluginMap, Plugin } from "api/PluginApi";
import {
  generateTemplateFormURL,
  saasEditorApiIdURL,
  saasEditorDatasourceIdURL,
} from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { CreateDatasourceSuccessAction } from "actions/datasourceActions";
import { getQueryParams } from "utils/URLUtils";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { DATASOURCE_SAAS_FORM } from "@appsmith/constants/forms";
import { initialize } from "redux-form";
import { omit } from "lodash";
import {
  getApplicationByIdFromWorkspaces,
  getCurrentApplicationIdForCreateNewApp,
} from "@appsmith/selectors/applicationSelectors";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";

function* handleDatasourceCreatedSaga(
  actionPayload: CreateDatasourceSuccessAction,
) {
  const { isDBCreated, payload } = actionPayload;
  const plugin: Plugin | undefined = yield select(getPlugin, payload.pluginId);
  // Only look at SAAS plugins
  if (!plugin) return;
  if (plugin.type !== PluginType.SAAS) return;

  const currentApplicationIdForCreateNewApp: string | undefined = yield select(
    getCurrentApplicationIdForCreateNewApp,
  );

  const application: ApplicationPayload | undefined = yield select(
    getApplicationByIdFromWorkspaces,
    currentApplicationIdForCreateNewApp || "",
  );
  const pageId: string = !!currentApplicationIdForCreateNewApp
    ? application?.defaultPageId
    : yield select(getCurrentPageId);

  yield put(initialize(DATASOURCE_SAAS_FORM, omit(payload, "name")));

  const queryParams = getQueryParams();
  const updatedDatasource = payload;

  const isGeneratePageInitiator = getIsGeneratePageInitiator(
    queryParams.isGeneratePageMode,
  );
  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap =
    yield select(getGenerateCRUDEnabledPluginMap);

  // isGeneratePageInitiator ensures that datasource is being created from generate page with data
  // then we check if the current plugin is supported for generate page with data functionality
  // and finally isDBCreated ensures that datasource is not in temporary state and
  // user has explicitly saved the datasource, before redirecting back to generate page
  if (
    isGeneratePageInitiator &&
    updatedDatasource.pluginId &&
    generateCRUDSupportedPlugin[updatedDatasource.pluginId] &&
    isDBCreated
  ) {
    history.push(
      generateTemplateFormURL({
        pageId,
        params: {
          datasourceId: updatedDatasource.id,
        },
      }),
    );
  } else if (
    !currentApplicationIdForCreateNewApp ||
    (!!currentApplicationIdForCreateNewApp && payload.id !== TEMP_DATASOURCE_ID)
  ) {
    history.push(
      saasEditorDatasourceIdURL({
        pageId,
        pluginPackageName: plugin.packageName,
        datasourceId: payload.id,
        params: {
          from: "datasources",
          pluginId: plugin?.id,
          viewMode: "false",
        },
      }),
    );
  }
}

function* handleActionCreatedSaga(actionPayload: ReduxAction<Action>) {
  const { id, pageId, pluginId } = actionPayload.payload;
  const plugin: Plugin | undefined = yield select(getPlugin, pluginId);

  if (!plugin) return;
  if (plugin.type !== "SAAS") return;
  history.push(
    saasEditorApiIdURL({
      pageId,
      pluginPackageName: plugin.packageName,
      apiId: id,
      params: {
        editName: "true",
        from: "datasources",
      },
    }),
  );
}

// since we are re-using the query editor form names for SAAS actions, all formValueChanges will be handled in the QuerypaneSagas.

export default function* root() {
  yield all([
    takeEvery(
      ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
      handleDatasourceCreatedSaga,
    ),
    takeEvery(ReduxActionTypes.CREATE_ACTION_SUCCESS, handleActionCreatedSaga),
  ]);
}
