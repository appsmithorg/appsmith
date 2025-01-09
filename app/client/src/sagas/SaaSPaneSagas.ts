import { all, call, put, select, takeEvery } from "redux-saga/effects";
import type { ApplicationPayload } from "entities/Application";
import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import history from "utils/history";
import {
  getGenerateCRUDEnabledPluginMap,
  getPlugin,
} from "ee/selectors/entitiesSelector";
import type { Action } from "entities/Action";
import { PluginType } from "entities/Action";
import type { GenerateCRUDEnabledPluginMap, Plugin } from "api/PluginApi";
import { saasEditorApiIdURL, saasEditorDatasourceIdURL } from "ee/RouteBuilder";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import type { CreateDatasourceSuccessAction } from "actions/datasourceActions";
import { getQueryParams } from "utils/URLUtils";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { DATASOURCE_SAAS_FORM } from "ee/constants/forms";
import { initialize } from "redux-form";
import { omit } from "lodash";
import {
  getApplicationByIdFromWorkspaces,
  getCurrentApplicationIdForCreateNewApp,
} from "ee/selectors/applicationSelectors";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { convertToBasePageIdSelector } from "selectors/pageListSelectors";
import { openGeneratePageModalWithSelectedDS } from "../utils/GeneratePageUtils";

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
  const basePageId: string = !!currentApplicationIdForCreateNewApp
    ? application?.defaultBasePageId
    : yield select(getCurrentBasePageId);

  yield put(initialize(DATASOURCE_SAAS_FORM, omit(payload, "name")));

  const queryParams = getQueryParams();
  const updatedDatasource = payload;

  const isGeneratePageInitiator = getIsGeneratePageInitiator(
    queryParams.isGeneratePageMode,
  );
  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap =
    yield select(getGenerateCRUDEnabledPluginMap);

  if (
    !currentApplicationIdForCreateNewApp ||
    (!!currentApplicationIdForCreateNewApp && payload.id !== TEMP_DATASOURCE_ID)
  ) {
    history.push(
      saasEditorDatasourceIdURL({
        basePageId,
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

  // isGeneratePageInitiator ensures that datasource is being created from generate page with data
  // then we check if the current plugin is supported for generate page with data functionality
  // and finally isDBCreated ensures that datasource is not in temporary state and
  // user has explicitly saved the datasource, before redirecting back to generate page
  yield call(openGeneratePageModalWithSelectedDS, {
    shouldOpenModalWIthSelectedDS: Boolean(
      isGeneratePageInitiator &&
        updatedDatasource.pluginId &&
        generateCRUDSupportedPlugin[updatedDatasource.pluginId] &&
        isDBCreated,
    ),
    datasourceId: updatedDatasource.id,
  });
}

function* handleActionCreatedSaga(actionPayload: ReduxAction<Action>) {
  const { baseId: baseActionId, pageId, pluginId } = actionPayload.payload;
  const plugin: Plugin | undefined = yield select(getPlugin, pluginId);

  if (!plugin) return;

  if (plugin.type !== "SAAS") return;

  const basePageId: string = yield select(convertToBasePageIdSelector, pageId);

  history.push(
    saasEditorApiIdURL({
      basePageId,
      pluginPackageName: plugin.packageName,
      baseApiId: baseActionId,
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
