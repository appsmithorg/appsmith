import { all, select, takeEvery } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import history from "utils/history";
import {
  getGenerateCRUDEnabledPluginMap,
  getPlugin,
} from "selectors/entitiesSelector";
import { Action, PluginType } from "entities/Action";
import { GenerateCRUDEnabledPluginMap, Plugin } from "api/PluginApi";
import {
  generateTemplateFormURL,
  saasEditorApiIdURL,
  saasEditorDatasourceIdURL,
} from "RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import { CreateDatasourceSuccessAction } from "actions/datasourceActions";
import { getQueryParams } from "utils/URLUtils";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";

function* handleDatasourceCreatedSaga(
  actionPayload: CreateDatasourceSuccessAction,
) {
  const { isDBCreated, payload } = actionPayload;
  const plugin: Plugin | undefined = yield select(getPlugin, payload.pluginId);
  const pageId: string = yield select(getCurrentPageId);
  // Only look at SAAS plugins
  if (!plugin) return;
  if (plugin.type !== PluginType.SAAS) return;

  const queryParams = getQueryParams();
  const updatedDatasource = payload;

  const isGeneratePageInitiator = getIsGeneratePageInitiator(
    queryParams.isGeneratePageMode,
  );
  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = yield select(
    getGenerateCRUDEnabledPluginMap,
  );

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
  } else {
    history.push(
      saasEditorDatasourceIdURL({
        pageId,
        pluginPackageName: plugin.packageName,
        datasourceId: payload.id,
        params: { from: "datasources", pluginId: plugin?.id },
      }),
    );
  }
}

function* handleActionCreatedSaga(actionPayload: ReduxAction<Action>) {
  const { id, pluginId } = actionPayload.payload;
  const plugin: Plugin | undefined = yield select(getPlugin, pluginId);
  const pageId: string = yield select(getCurrentPageId);

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
