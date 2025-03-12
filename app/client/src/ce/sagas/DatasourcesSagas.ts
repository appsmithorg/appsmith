import { all, call, fork, put, select, take } from "redux-saga/effects";
import {
  change,
  getFormInitialValues,
  getFormValues,
  initialize,
  isValid,
} from "redux-form";
import { get, isEmpty, merge, omit, partition, set } from "lodash";
import equal from "fast-deep-equal/es6";
import type {
  ReduxAction,
  ReduxActionWithCallbacks,
  ReduxActionWithMeta,
} from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentBasePageId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  type DatasourceGroupByPluginCategory,
  getActions,
  getDatasourceByPluginId,
} from "ee/selectors/entitiesSelector";
import {
  getDatasource,
  getDatasourceActionRouteInfo,
  getDatasourceDraft,
  getDatasources,
  getDatasourcesGroupedByPluginCategory,
  getDatasourcesUsedInApplicationByActions,
  getEditorConfig,
  getEntityExplorerDatasources,
  getGenerateCRUDEnabledPluginMap,
  getPlugin,
  getPluginByPackageName,
  getPluginForm,
  getPluginPackageFromDatasourceId,
  PluginCategory,
} from "ee/selectors/entitiesSelector";
import type {
  executeDatasourceQueryReduxAction,
  UpdateDatasourceSuccessAction,
} from "actions/datasourceActions";
import {
  addMockDatasourceToWorkspace,
  changeDatasource,
  createDatasourceSuccess,
  createTempDatasourceFromForm,
  fetchDatasourceStructure,
  removeTempDatasource,
  resetDefaultKeyValPairFlag,
  setDatasourceViewMode,
  setDatasourceViewModeFlag,
  updateDatasourceAuthState,
  updateDatasourceSuccess,
} from "actions/datasourceActions";
import type { ApiResponse } from "api/ApiResponses";
import type { CreateDatasourceConfig } from "api/DatasourcesApi";
import DatasourcesApi from "api/DatasourcesApi";
import type {
  Datasource,
  DatasourceStorage,
  DatasourceStructureContext,
  MockDatasource,
  TokenResponse,
} from "entities/Datasource";
import {
  AuthenticationStatus,
  FilePickerActionStatus,
} from "entities/Datasource";
import {
  INTEGRATION_TABS,
  RESPONSE_STATUS,
  SHOW_FILE_PICKER_KEY,
} from "constants/routes";
import history from "utils/history";
import {
  API_EDITOR_FORM_NAME,
  DATASOURCE_DB_FORM,
  DATASOURCE_REST_API_FORM,
} from "ee/constants/forms";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import { setIdeEditorViewMode } from "../../actions/ideActions";
import { EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { getIsAnvilEnabledInCurrentApplication } from "../../layoutSystems/anvil/integrations/selectors";
import { createActionRequestSaga } from "../../sagas/ActionSagas";
import { validateResponse } from "../../sagas/ErrorSagas";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { GetFormData } from "selectors/formSelectors";
import { getFormData } from "selectors/formSelectors";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { getConfigInitialValues } from "components/formControls/utils";
import { setActionProperty } from "actions/pluginActionActions";
import { authorizeDatasourceWithAppsmithToken } from "api/CloudServicesApi";
import {
  createMessage,
  DATASOURCE_CREATE,
  DATASOURCE_DELETE,
  DATASOURCE_SCHEMA_NOT_AVAILABLE,
  DATASOURCE_UPDATE,
  DATASOURCE_VALID,
  FILES_NOT_SELECTED_EVENT,
  GSHEET_AUTHORISED_FILE_IDS_KEY,
  OAUTH_APPSMITH_TOKEN_NOT_FOUND,
  OAUTH_AUTHORIZATION_APPSMITH_ERROR,
  OAUTH_AUTHORIZATION_FAILED,
  OAUTH_AUTHORIZATION_SUCCESSFUL,
} from "ee/constants/messages";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import localStorage from "utils/localStorage";
import log from "loglevel";
import { APPSMITH_TOKEN_STORAGE_KEY } from "pages/Editor/SaaSEditor/constants";
import { checkAndGetPluginFormConfigsSaga } from "sagas/PluginSagas";
import { type Action } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { getQueryParams } from "utils/URLUtils";
import {
  type GenerateCRUDEnabledPluginMap,
  type Plugin,
  PluginPackageName,
  PluginType,
} from "entities/Plugin";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import {
  klonaLiteWithTelemetry,
  shouldBeDefined,
  trimQueryString,
} from "utils/helpers";
import { updateReplayEntity } from "actions/pageActions";
import OAuthApi from "api/OAuthApi";
import type { AppState } from "ee/reducers";
import {
  getApplicationByIdFromWorkspaces,
  getCurrentApplication,
  getCurrentApplicationIdForCreateNewApp,
  getWorkspaceIdForImport,
} from "ee/selectors/applicationSelectors";
import {
  apiEditorIdURL,
  datasourcesEditorIdURL,
  integrationEditorURL,
  saasEditorDatasourceIdURL,
} from "ee/RouteBuilder";
import {
  GOOGLE_SHEET_FILE_PICKER_OVERLAY_CLASS,
  GOOGLE_SHEET_SPECIFIC_SHEETS_SCOPE,
  TEMP_DATASOURCE_ID,
} from "constants/Datasource";
import { toast } from "@appsmith/ads";
import { fetchPluginFormConfig } from "actions/pluginActions";
import { addClassToDocumentRoot } from "pages/utils";
import { AuthorizationStatus } from "pages/common/datasourceAuth";
import {
  getFormDiffPaths,
  getFormName,
  isGoogleSheetPluginDS,
} from "utils/editorContextUtils";
import { getDefaultEnvId } from "ee/api/ApiUtils";
import {
  getCurrentEditingEnvironmentId,
  getCurrentEnvironmentDetails,
  isEnvironmentFetching,
} from "ee/selectors/environmentSelectors";
import { waitForFetchEnvironments } from "ee/sagas/EnvironmentSagas";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import FocusRetention from "../../sagas/FocusRetentionSaga";
import { identifyEntityFromPath } from "../../navigation/FocusEntity";
import { MAX_DATASOURCE_SUGGESTIONS } from "constants/DatasourceEditorConstants";
import {
  getFromServerWhenNoPrefetchedResult,
  getInitialActionPayload,
  getInitialDatasourcePayload,
} from "../../sagas/helper";
import { executeGoogleApi } from "../../sagas/loadGoogleApi";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";
import { getCurrentModuleId } from "ee/selectors/modulesSelector";
import type { ApplicationPayload } from "entities/Application";
import { openGeneratePageModalWithSelectedDS } from "../../utils/GeneratePageUtils";

export function* fetchDatasourcesSaga(
  action: ReduxAction<
    | { workspaceId?: string; datasources?: ApiResponse<Datasource[]> }
    | undefined
  >,
) {
  try {
    let workspaceId: string = yield select(getCurrentWorkspaceId);

    if (action.payload?.workspaceId) workspaceId = action.payload?.workspaceId;

    const datasources = action.payload?.datasources;
    const response: ApiResponse<Datasource[]> = yield call(
      getFromServerWhenNoPrefetchedResult,
      datasources,
      async () => DatasourcesApi.fetchDatasources(workspaceId),
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
      payload: { error },
    });
  }
}

export function* handleFetchDatasourceStructureOnLoad() {
  try {
    // we fork to prevent the call from blocking
    yield fork(fetchDatasourceStructureOnLoad);
  } catch (error) {}
}

function* fetchDatasourceStructureOnLoad() {
  try {
    // get datasources of all actions used in the the application
    let datasourcesUsedInApplication: Datasource[] = yield select(
      getDatasourcesUsedInApplicationByActions,
    );

    // get datasources present in entity explorer and not part of any action.
    if (datasourcesUsedInApplication.length < MAX_DATASOURCE_SUGGESTIONS) {
      const datasourceInEntityExplorer: Datasource[] = yield select(
        getEntityExplorerDatasources,
      );

      datasourcesUsedInApplication = [
        ...datasourcesUsedInApplication,
        ...datasourceInEntityExplorer,
      ];
    }

    //fetch datasource structure for each datasource
    for (const datasource of datasourcesUsedInApplication) {
      yield put(fetchDatasourceStructure(datasource.id, true));
    }
  } catch (error) {}
}

export function* fetchMockDatasourcesSaga(action?: {
  payload?: { mockDatasources?: ApiResponse };
}) {
  const mockDatasources = action?.payload?.mockDatasources;

  try {
    const response: ApiResponse = yield call(
      getFromServerWhenNoPrefetchedResult,
      mockDatasources,
      async () => DatasourcesApi.fetchMockDatasources(),
    );

    // not validating the api call here. If the call is unsuccessful it'll be unblocking. And we'll hide the mock DB section.
    yield put({
      type: ReduxActionTypes.FETCH_MOCK_DATASOURCES_SUCCESS,
      payload: !!response && !!response.data ? response.data : [],
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_MOCK_DATASOURCES_ERROR,
      payload: { error },
    });
  }
}

interface addMockDb
  extends ReduxActionWithCallbacks<
    {
      name: string;
      workspaceId: string;
      pluginId: string;
      packageName: string;
      skipRedirection?: boolean;
    },
    unknown,
    unknown
  > {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraParams?: any;
}

export function* addMockDbToDatasources(actionPayload: addMockDb) {
  try {
    const { name, packageName, pluginId, skipRedirection, workspaceId } =
      actionPayload.payload;
    const { isGeneratePageMode } = actionPayload.extraParams;
    const currentApplicationIdForCreateNewApp: string | undefined =
      yield select(getCurrentApplicationIdForCreateNewApp);
    const application: ApplicationPayload | undefined = yield select(
      getApplicationByIdFromWorkspaces,
      currentApplicationIdForCreateNewApp || "",
    );
    const basePageId: string = !!currentApplicationIdForCreateNewApp
      ? application?.defaultBasePageId
      : yield select(getCurrentBasePageId);
    const response: ApiResponse<Datasource> =
      yield DatasourcesApi.addMockDbToDatasources(
        name,
        workspaceId,
        pluginId,
        packageName,
      );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.ADD_MOCK_DATASOURCES_SUCCESS,
        payload: response.data,
      });
      yield put({
        type: ReduxActionTypes.FETCH_DATASOURCES_INIT,
      });
      yield put({
        type: ReduxActionTypes.FETCH_PLUGINS_REQUEST,
      });
      yield call(checkAndGetPluginFormConfigsSaga, response.data.pluginId);
      // fetch datasource structure for the created mock datasource.
      yield put(fetchDatasourceStructure(response.data.id, true));
      const isGeneratePageInitiator =
        getIsGeneratePageInitiator(isGeneratePageMode);

      if (skipRedirection) {
        return;
      }

      let url = "";
      const plugin: Plugin = yield select(getPlugin, response.data.pluginId);

      if (plugin && plugin.type === PluginType.SAAS) {
        url = saasEditorDatasourceIdURL({
          basePageId,
          pluginPackageName: plugin.packageName,
          datasourceId: response.data.id,
          params: {
            viewMode: true,
          },
        });
      } else {
        url = datasourcesEditorIdURL({
          basePageId,
          datasourceId: response.data.id,
          params: omit(getQueryParams(), "viewMode"),
        });
      }

      history.push(url);

      yield call(openGeneratePageModalWithSelectedDS, {
        shouldOpenModalWIthSelectedDS: Boolean(isGeneratePageInitiator),
        datasourceId: response.data.id,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.ADD_MOCK_DATASOURCES_ERROR,
      payload: { error },
    });
  }
}

/**
 * Adds custom redirect logic to redirect after an item is deleted
 * 1. Do not navigate if the deleted item is not selected
 * 2. If it is the only item, navigate to the add url
 * 3. If there are other items, navigate to an item close to the current one
 * **/
function* handleDatasourceDeleteRedirect(deletedDatasourceId: string) {
  const allDatasources: Datasource[] = yield select(getDatasources);

  const currentSelectedEntity = identifyEntityFromPath(
    window.location.pathname,
  );
  const isSelectedDatasourceDeleted =
    currentSelectedEntity.id === deletedDatasourceId;

  // Don't do anything if current selection is not the deleted datasource
  if (!isSelectedDatasourceDeleted) {
    return;
  }

  const remainingDatasources = allDatasources.filter(
    (d) => d.id !== deletedDatasourceId,
  );

  // Go to the add datasource if the last item is deleted
  if (remainingDatasources.length === 0) {
    yield call(() =>
      history.push(integrationEditorURL({ selectedTab: INTEGRATION_TABS.NEW })),
    );

    return;
  }

  // Try to find if any other item in the same group is present,
  // if not, navigate to the first item on the list
  const groupedDatasources: DatasourceGroupByPluginCategory = yield select(
    getDatasourcesGroupedByPluginCategory,
  );
  let deletedGroup: PluginCategory = PluginCategory.Others;

  for (const [group, datasources] of Object.entries(groupedDatasources)) {
    if (datasources.find((d) => d.id === deletedDatasourceId)) {
      deletedGroup = group as PluginCategory;
      break;
    }
  }

  const groupDatasources = groupedDatasources[deletedGroup];
  const remainingGroupDatasources = groupDatasources.filter(
    (d) => d.id !== deletedDatasourceId,
  );

  if (remainingGroupDatasources.length === 0) {
    history.push(
      datasourcesEditorIdURL({ datasourceId: remainingDatasources[0].id }),
    );
  } else {
    history.push(
      datasourcesEditorIdURL({ datasourceId: remainingGroupDatasources[0].id }),
    );
  }
}

export function* deleteDatasourceSaga(
  actionPayload: ReduxActionWithCallbacks<{ id: string }, unknown, unknown>,
) {
  try {
    const id = actionPayload.payload.id;
    const response: ApiResponse<Datasource> =
      yield DatasourcesApi.deleteDatasource(id);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const currentUrl = window.location.pathname;

      yield call(handleDatasourceDeleteRedirect, id);
      yield call(FocusRetention.handleRemoveFocusHistory, currentUrl);

      toast.show(createMessage(DATASOURCE_DELETE, response.data.name), {
        kind: "success",
      });

      yield put({
        type: ReduxActionTypes.DELETE_DATASOURCE_SUCCESS,
        payload: response.data,
      });
      yield put({
        type: ReduxActionTypes.DELETE_DATASOURCE_DRAFT,
        payload: {
          id: response.data.id,
        },
      });
      AppsmithConsole.info({
        logType: LOG_TYPE.ENTITY_DELETED,
        text: "Datasource deleted",
        source: {
          id: response.data.id,
          name: response.data.name,
          type: ENTITY_TYPE.DATASOURCE,
        },
      });

      if (actionPayload.onSuccess) {
        yield put(actionPayload.onSuccess);
      }
    }
  } catch (error) {
    const datasource = shouldBeDefined<Datasource>(
      yield select(getDatasource, actionPayload.payload.id),
      `Datasource not found for id - ${actionPayload.payload.id}`,
    );

    yield put({
      type: ReduxActionErrorTypes.DELETE_DATASOURCE_ERROR,
      payload: { error, id: actionPayload.payload.id, show: true },
    });
    AppsmithConsole.error({
      text: (error as Error).message,
      source: {
        id: actionPayload.payload.id,
        name: datasource.name,
        type: ENTITY_TYPE.DATASOURCE,
      },
    });

    if (actionPayload.onError) {
      yield put(actionPayload.onError);
    }
  }
}

const getConnectionMethod = (
  datasourceStoragePayload: DatasourceStorage,
  pluginPackageName: string,
) => {
  const properties = get(
    datasourceStoragePayload,
    "datasourceConfiguration.properties",
  );

  switch (pluginPackageName) {
    case PluginPackageName.MY_SQL:
      return properties?.[1]?.value;
    default:
      return null;
  }
};

export function* updateDatasourceSaga(
  actionPayload: ReduxActionWithCallbacks<
    Datasource & { isInsideReconnectModal: boolean; currEditingEnvId?: string },
    unknown,
    unknown
  >,
) {
  try {
    const currentEnvDetails: { editingId: string; name: string } = yield select(
      getCurrentEnvironmentDetails,
    );
    const queryParams = getQueryParams();
    const currentEnvironment =
      actionPayload.payload?.currEditingEnvId || currentEnvDetails.editingId;
    const datasourcePayload = omit(actionPayload.payload, "name");
    const datasourceStoragePayload =
      datasourcePayload.datasourceStorages[currentEnvironment];
    const pluginPackageName: PluginPackageName = yield select(
      getPluginPackageFromDatasourceId,
      datasourcePayload?.id,
    );
    const isAnvilEnabled: boolean = yield select(
      getIsAnvilEnabledInCurrentApplication,
    );

    // when clicking save button, it should be changed as configured
    set(datasourceStoragePayload, `isConfigured`, true);

    if (!datasourceStoragePayload.hasOwnProperty("datasourceId")) {
      if (datasourcePayload.id !== TEMP_DATASOURCE_ID)
        set(datasourceStoragePayload, `datasourceId`, datasourcePayload.id);
    } else if (datasourceStoragePayload.datasourceId === TEMP_DATASOURCE_ID) {
      datasourceStoragePayload.datasourceId = "";
    }

    if (!datasourceStoragePayload.hasOwnProperty("environmentId")) {
      set(datasourceStoragePayload, `environmentId`, currentEnvironment);
    }

    // When importing app with google sheets with specific sheets scope
    // We do not want to set isConfigured to true immediately on save
    // instead we want to wait for authorisation as well as file selection to be complete
    if (isGoogleSheetPluginDS(pluginPackageName)) {
      const value = get(datasourceStoragePayload, `authentication.scopeString`);
      const scopeString: string = value ? value : "";

      if (scopeString.includes(GOOGLE_SHEET_SPECIFIC_SHEETS_SCOPE)) {
        datasourceStoragePayload.isConfigured = false;
      }
    }

    const isNewStorage = !datasourceStoragePayload.hasOwnProperty("id");
    let response: ApiResponse<Datasource>;

    // if storage is new, we have to use create datasource call
    if (isNewStorage) {
      response = yield DatasourcesApi.createDatasource(datasourcePayload);
    } else {
      // if storage is already created, we can use update datasource call
      response = yield DatasourcesApi.updateDatasourceStorage(
        datasourceStoragePayload,
      );
    }

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      //Update call only returns the updated storage of current environment.
      //So we need to update the other storages with the old values.
      // TODO server should send ony the updated storage or whole datasource.
      if (!isNewStorage) {
        Object.keys(datasourcePayload.datasourceStorages).forEach(
          (storageId: string) => {
            if (storageId !== currentEnvironment) {
              response.data.datasourceStorages[storageId] =
                datasourcePayload.datasourceStorages[storageId];
            }
          },
        );
      }

      const responseData: Datasource = response.data;
      const plugin: Plugin = yield select(getPlugin, responseData?.pluginId);
      const formName: string = getFormName(plugin);
      const state: AppState = yield select();
      const isFormValid = isValid(formName)(state);
      const formData: GetFormData = yield select(getFormData, formName);
      const formDiffPaths: string[] = getFormDiffPaths(
        formData.initialValues,
        formData.values,
      );

      AnalyticsUtil.logEvent("SAVE_DATA_SOURCE", {
        datasourceId: responseData?.id,
        datasourceName: responseData.name,
        environmentId: currentEnvironment,
        environmentName: currentEnvDetails.name,
        pluginName: plugin?.name || "",
        pluginPackageName: plugin?.packageName || "",
        isFormValid: isFormValid,
        editedFields: formDiffPaths,
        connectionMethod: getConnectionMethod(
          datasourceStoragePayload,
          pluginPackageName,
        ),
      });
      toast.show(createMessage(DATASOURCE_UPDATE, responseData.name), {
        kind: "success",
      });

      const expandDatasourceId = state.ui.datasourcePane.expandDatasourceId;

      // Dont redirect if action payload has an onSuccess
      yield put(
        updateDatasourceSuccess(
          responseData,
          !actionPayload.onSuccess,
          queryParams,
        ),
      );
      yield put({
        type: ReduxActionTypes.DELETE_DATASOURCE_DRAFT,
        payload: {
          id: responseData.id,
        },
      });

      if (actionPayload.onSuccess) {
        yield put(actionPayload.onSuccess);
      }

      if (expandDatasourceId === responseData.id) {
        yield put(fetchDatasourceStructure(responseData.id, true));
      }

      AppsmithConsole.info({
        text: "Datasource configuration saved",
        source: {
          id: responseData.id,
          name: responseData.name,
          type: ENTITY_TYPE.DATASOURCE,
        },
        state: {
          datasourceConfiguration:
            responseData.datasourceStorages[currentEnvironment]
              .datasourceConfiguration,
        },
      });

      // If the datasource is being updated from the reconnect modal, we don't want to change the view mode
      // or update initial values as the next form open will be from the reconnect modal itself
      if (!datasourcePayload.isInsideReconnectModal) {
        // Don't redirect to view mode if the plugin is google sheets
        // Also don't redirect to view mode if anvil is enabled and plugin is APPSMITH_AI
        if (
          pluginPackageName !== PluginPackageName.GOOGLE_SHEETS &&
          !(
            isAnvilEnabled &&
            pluginPackageName === PluginPackageName.APPSMITH_AI
          )
        ) {
          yield put(
            setDatasourceViewMode({
              datasourceId: response.data.id,
              viewMode: true,
            }),
          );
        }

        // updating form initial values to latest data, so that next time when form is opened
        // isDirty will use updated initial values data to compare actual values with
        yield put(initialize(DATASOURCE_DB_FORM, responseData));
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_DATASOURCE_ERROR,
      payload: { error },
    });

    if (actionPayload.onError) {
      yield put(actionPayload.onError);
    }
  }
}

export function* redirectAuthorizationCodeSaga(
  actionPayload: ReduxAction<{
    contextId: string;
    contextType: ActionParentEntityTypeInterface;
    datasourceId: string;
    pluginType: PluginType;
  }>,
) {
  const { contextId, contextType, datasourceId, pluginType } =
    actionPayload.payload;
  const isImport: string = yield select(getWorkspaceIdForImport);
  // ! git mod - not sure how to handle this, there is no definition for the artifact used here
  const branchName: string | undefined = yield select(getCurrentGitBranch);

  if (pluginType === PluginType.API) {
    const currentEnvironment: string = yield select(
      getCurrentEditingEnvironmentId,
    );
    let windowLocation = `/api/v1/datasources/${datasourceId}/pages/${contextId}/code?environmentId=${currentEnvironment}`;

    if (!!branchName) {
      windowLocation = windowLocation + `&branchName=` + branchName;
    }

    window.location.href = windowLocation;
  } else {
    try {
      // Get an "appsmith token" from the server
      const response: ApiResponse<string> = yield OAuthApi.getAppsmithToken(
        datasourceId,
        contextId,
        contextType,
        !!isImport,
      );

      if (validateResponse(response)) {
        const appsmithToken = response.data;

        // Save the token for later use once we come back from the auth flow
        localStorage.setItem(APPSMITH_TOKEN_STORAGE_KEY, appsmithToken);
        // Redirect to the cloud services to authorise
        window.location.assign(
          authorizeDatasourceWithAppsmithToken(appsmithToken),
        );
      }
    } catch (e) {
      toast.show(OAUTH_AUTHORIZATION_FAILED, {
        kind: "error",
      });
      log.error(e);
    }
  }
}

export function* getOAuthAccessTokenSaga(
  actionPayload: ReduxAction<{ datasourceId: string }>,
) {
  const { datasourceId } = actionPayload.payload;
  // get the saved appsmith token that started the auth request
  const appsmithToken = localStorage.getItem(APPSMITH_TOKEN_STORAGE_KEY);
  const applicationId: string = yield select(getCurrentApplicationId);
  const pageId: string = yield select(getCurrentPageId);

  if (!appsmithToken) {
    // Error out because auth token should been here
    log.error(OAUTH_APPSMITH_TOKEN_NOT_FOUND);
    yield put({
      type: ReduxActionErrorTypes.GET_OAUTH_ACCESS_TOKEN_ERROR,
      show: true,
      payload: {
        datasourceId: datasourceId,
        error: {
          message: OAUTH_AUTHORIZATION_APPSMITH_ERROR,
        },
      },
    });

    return;
  }

  try {
    // wait for envs to be fetched
    yield call(waitForFetchEnvironments);
    // Get access token for datasource
    const response: ApiResponse<TokenResponse> = yield OAuthApi.getAccessToken(
      datasourceId,
      appsmithToken,
    );
    const plugin: Plugin = yield select(
      getPlugin,
      response.data.datasource?.pluginId,
    );

    if (validateResponse(response)) {
      // Update the datasource storage object only since the token call only returns the storage object
      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_STORAGE_SUCCESS,
        payload: response.data.datasource, // This is the datasourceStorage object
      });

      if (!!response.data.token) {
        yield put({
          type: ReduxActionTypes.SET_GSHEET_TOKEN,
          payload: {
            gsheetToken: response.data.token,
            gsheetProjectID: response.data.projectID,
          },
        });
      } else {
        const currentEnvDetails: { id: string; name: string } = yield select(
          getCurrentEnvironmentDetails,
        );

        AnalyticsUtil.logEvent("DATASOURCE_AUTH_COMPLETE", {
          applicationId: applicationId,
          datasourceId: datasourceId,
          environmentId: currentEnvDetails.id,
          environmentName: currentEnvDetails.name,
          pageId: pageId,
          oAuthPassOrFailVerdict: "success",
          workspaceId: response.data.datasource?.workspaceId,
          datasourceName: response.data.datasource?.name,
          pluginName: plugin?.name,
        });
        toast.show(OAUTH_AUTHORIZATION_SUCCESSFUL, {
          kind: "success",
        });
      }

      // Remove the token because it is supposed to be short lived
      localStorage.removeItem(APPSMITH_TOKEN_STORAGE_KEY);
      yield put({
        type: ReduxActionTypes.GET_OAUTH_ACCESS_TOKEN_SUCCESS,
        payload: { datasourceId: datasourceId },
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.GET_OAUTH_ACCESS_TOKEN_ERROR,
      payload: {
        datasourceId: datasourceId,
        show: true,
        error: {
          message: OAUTH_AUTHORIZATION_FAILED,
        },
      },
    });
    log.error(e);
  }
}

export function* updateDatasourceNameSaga(
  actionPayload: ReduxAction<{ id: string; name: string }>,
) {
  try {
    const response: ApiResponse<Datasource> =
      yield DatasourcesApi.updateDatasource(
        {
          name: actionPayload.payload.name,
        },
        actionPayload.payload.id,
      );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      // update error state of datasourcename
      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_NAME_SUCCESS,
        payload: { ...response.data },
      });

      // update name in the datasource Object as well
      yield put({
        type: ReduxActionTypes.SAVE_DATASOURCE_NAME_SUCCESS,
        payload: { ...response.data },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_DATASOURCE_NAME_ERROR,
      payload: { id: actionPayload.payload.id },
    });
  }
}

export function* handleDatasourceNameChangeFailureSaga(
  action: ReduxAction<{ oldName: string }>,
) {
  yield put(change(DATASOURCE_DB_FORM, "name", action.payload.oldName));
}

export function* testDatasourceSaga(actionPayload: ReduxAction<Datasource>) {
  let workspaceId: string = yield select(getCurrentWorkspaceId);

  // test button within the import modal
  if (!workspaceId) {
    workspaceId = yield select(getWorkspaceIdForImport);
  }

  const { initialValues } = yield select(getFormData, DATASOURCE_DB_FORM);
  const datasource = shouldBeDefined<Datasource>(
    yield select(getDatasource, actionPayload.payload.id),
    `Datasource not found for id - ${actionPayload.payload.id}`,
  );
  const currentEnvironment: string = yield select(
    getCurrentEditingEnvironmentId,
  );
  const payload = {
    ...actionPayload.payload,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: actionPayload.payload.id as any,
  };
  const plugin: Plugin = yield select(getPlugin, datasource?.pluginId);
  let payloadWithoutDatasourceId: DatasourceStorage =
    payload.datasourceStorages[currentEnvironment];

  const initialDSStorage = initialValues.datasourceStorages[currentEnvironment];

  // when datasource is not yet saved by user, datasource id is temporary
  // for temporary datasource, we do not need to pass datasource id in test api call
  if (
    !equal(initialDSStorage, payloadWithoutDatasourceId) ||
    payloadWithoutDatasourceId?.datasourceId === TEMP_DATASOURCE_ID
  ) {
    // we have to do this so that the original object is not mutated
    payloadWithoutDatasourceId = {
      ...payloadWithoutDatasourceId,
      datasourceId: "",
    };
  }

  const currentEnvDetails: { id: string; name: string } = yield select(
    getCurrentEnvironmentDetails,
  );

  try {
    const response: ApiResponse<Datasource> =
      yield DatasourcesApi.testDatasource(
        payloadWithoutDatasourceId,
        plugin.id,
        workspaceId,
      );
    const isValidResponse: boolean = yield validateResponse(response);
    let messages: Array<string> = [];

    if (isValidResponse) {
      const responseData = response.data;

      if (responseData.messages && responseData.messages.length) {
        messages = responseData.messages;

        if (responseData.success) {
          toast.show(createMessage(DATASOURCE_VALID, payload.name), {
            kind: "success",
          });
        }
      }

      if (responseData.invalids && responseData.invalids.length) {
        AnalyticsUtil.logEvent("TEST_DATA_SOURCE_FAILED", {
          datasourceId: datasource?.id,
          environmentId: currentEnvironment,
          environmentName: currentEnvDetails.name,
          pluginName: plugin?.name,
          errorMessages: responseData.invalids,
          messages: responseData.messages,
        });
        yield put({
          type: ReduxActionErrorTypes.TEST_DATASOURCE_ERROR,
          payload: {
            id: datasource.id,
            environmentId: currentEnvironment,
            show: true,
            error: { message: responseData.invalids.join("\n") },
          },
        });
        AppsmithConsole.error({
          text: "Test Connection failed",
          source: {
            id: actionPayload.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
          state: {
            message:
              responseData.invalids && responseData.invalids.length
                ? responseData.invalids[0]
                : "",
          },
        });
      } else {
        AnalyticsUtil.logEvent("TEST_DATA_SOURCE_SUCCESS", {
          datasourceName: payload.name,
          datasoureId: datasource?.id,
          environmentId: currentEnvironment,
          environmentName: currentEnvDetails.name,
          pluginName: plugin?.name,
        });
        toast.show(createMessage(DATASOURCE_VALID, payload.name), {
          kind: "success",
        });
        yield put({
          type: ReduxActionTypes.TEST_DATASOURCE_SUCCESS,
          payload: {
            show: false,
            id: datasource.id,
            environmentId: currentEnvironment,
            messages: messages,
          },
        });
        AppsmithConsole.info({
          text: "Test Connection successful",
          source: {
            id: actionPayload.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.TEST_DATASOURCE_ERROR,
      payload: { error, show: false, environmentId: currentEnvironment },
    });
    AnalyticsUtil.logEvent("TEST_DATA_SOURCE_FAILED", {
      datasoureId: datasource?.id,
      environmentId: currentEnvironment,
      environmentName: currentEnvDetails.name,
      pluginName: plugin?.name,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorMessages: (error as any)?.message,
    });
    AppsmithConsole.error({
      text: "Test Connection failed",
      source: {
        id: actionPayload.payload.id,
        name: datasource.name,
        type: ENTITY_TYPE.DATASOURCE,
      },
      state: {
        message: error,
      },
    });
  }
}

export function* createTempDatasourceFromFormSaga(
  actionPayload: ReduxAction<CreateDatasourceConfig | Datasource>,
) {
  yield call(checkAndGetPluginFormConfigsSaga, actionPayload.payload.pluginId);
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formConfig: Record<string, any>[] = yield select(
    getPluginForm,
    actionPayload.payload.pluginId,
  );
  const initialValues: unknown = yield call(getConfigInitialValues, formConfig);

  let datasourceType = actionPayload?.payload?.type;

  if (!actionPayload?.payload.type) {
    const plugin: Plugin = yield select(
      getPlugin,
      actionPayload?.payload.pluginId,
    );

    datasourceType = plugin?.type;
  }

  const defaultEnvId = getDefaultEnvId();
  const initialPayload: Datasource = yield getInitialDatasourcePayload(
    actionPayload.payload.pluginId,
    datasourceType,
  );

  const payload = merge(initialPayload, actionPayload.payload);

  payload.datasourceStorages[defaultEnvId] = merge(
    payload.datasourceStorages[defaultEnvId],
    initialValues,
  );

  const currentApplicationIdForCreateNewApp: string | undefined = yield select(
    getCurrentApplicationIdForCreateNewApp,
  );

  if (currentApplicationIdForCreateNewApp) {
    yield put({
      type: ReduxActionTypes.SET_CURRENT_PLUGIN_ID_FOR_CREATE_NEW_APP,
      payload: actionPayload.payload.pluginId,
    });
  }

  yield put(createDatasourceSuccess(payload as Datasource));

  yield put({
    type: ReduxActionTypes.SAVE_DATASOURCE_NAME,
    payload,
  });

  yield put(
    setDatasourceViewMode({
      datasourceId: payload.id,
      viewMode: false,
    }),
  );
}

/**
 * Verifies whether a datasource for the specified plugin exists. If it does not, creates one.
 * Then, creates an action for the datasource based on passed action configuration.
 * @returns Action - return the created Action
 * @param pluginPackageName - determine whether a datasource exists by its pluginPackageName.
 * @param actionConfig - configuration for action creation
 * @param datasourceName - name with which the datasource will be created
 */
export function* createOrUpdateDataSourceWithAction(
  pluginPackageName: PluginPackageName,
  actionConfig: Action,
  datasourceName?: string,
) {
  const plugin: Plugin = yield select(
    getPluginByPackageName,
    pluginPackageName,
  );
  const datasources: Datasource[] = yield select(
    getDatasourceByPluginId,
    plugin.id,
  );
  const pageId: string = yield select(getCurrentPageId);
  const datasourcePayload: Datasource = yield getInitialDatasourcePayload(
    plugin.id,
    plugin.type,
    datasourceName,
  );

  if (datasources.length === 0) {
    yield createDatasourceFromFormSaga({
      payload: datasourcePayload,
      type: ReduxActionTypes.CREATE_DATASOURCE_FROM_FORM_INIT,
    });
  }

  const actionPayload: Datasource = yield getInitialActionPayload(
    pageId,
    plugin.id,
    actionConfig,
  );

  yield createActionRequestSaga({
    payload: actionPayload,
    type: ReduxActionTypes.CREATE_ACTION_REQUEST,
  });

  yield put(setIdeEditorViewMode(EditorViewMode.SplitScreen));

  const actions: ActionDataState = yield select(getActions);

  return actions[actions.length - 1];
}

export function* createDatasourceFromFormSaga(
  actionPayload: ReduxActionWithCallbacks<
    Datasource | CreateDatasourceConfig,
    unknown,
    unknown
  >,
) {
  try {
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const actionRouteInfo: ReturnType<typeof getDatasourceActionRouteInfo> =
      yield select(getDatasourceActionRouteInfo);

    yield call(
      checkAndGetPluginFormConfigsSaga,
      actionPayload.payload.pluginId,
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formConfig: Record<string, any>[] = yield select(
      getPluginForm,
      actionPayload.payload.pluginId,
    );
    const currentEnvironment: string = yield select(
      getCurrentEditingEnvironmentId,
    );

    const initialValues: unknown = yield call(
      getConfigInitialValues,
      formConfig,
    );
    let datasourceStoragePayload =
      actionPayload.payload.datasourceStorages[currentEnvironment];

    datasourceStoragePayload = merge(initialValues, datasourceStoragePayload);

    // in the datasourcestorages, we only need one key, the currentEnvironment
    // we need to remove any other keys present
    const datasourceStorages = {
      [currentEnvironment]: datasourceStoragePayload,
    };

    const payload = omit(
      {
        ...actionPayload.payload,
        datasourceStorages,
      },
      ["id", "new", "type", "datasourceConfiguration"],
    );

    if (payload.datasourceStorages)
      datasourceStoragePayload.isConfigured = true;

    // remove datasourceId from payload if it is equal to TEMP_DATASOURCE_ID
    if (datasourceStoragePayload.datasourceId === TEMP_DATASOURCE_ID)
      datasourceStoragePayload.datasourceId = "";

    const response: ApiResponse<Datasource> =
      yield DatasourcesApi.createDatasource({
        ...payload,
        workspaceId,
      });
    const isValidResponse: boolean = yield validateResponse(response);
    const currentEnvDetails: { id: string; name: string } = yield select(
      getCurrentEnvironmentDetails,
    );

    if (isValidResponse) {
      const plugin: Plugin = yield select(getPlugin, response?.data?.pluginId);
      const formName: string = getFormName(plugin);
      const state: AppState = yield select();
      const isFormValid = isValid(formName)(state);
      const formData: GetFormData = yield select(getFormData, formName);
      const formDiffPaths: string[] = getFormDiffPaths(
        formData.initialValues,
        formData.values,
      );

      AnalyticsUtil.logEvent("SAVE_DATA_SOURCE", {
        datasourceId: response?.data?.id,
        datasourceName: response?.data?.name,
        environmentId: currentEnvironment,
        environmentName: currentEnvDetails.name,
        pluginName: plugin?.name || "",
        pluginPackageName: plugin?.packageName || "",
        isFormValid: isFormValid,
        editedFields: formDiffPaths,
        connectionMethod: getConnectionMethod(
          datasourceStoragePayload,
          plugin?.packageName,
        ),
      });
      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_REFS,
        payload: response.data,
      });
      yield put(
        createDatasourceSuccess(
          response.data,
          true,
          !!actionRouteInfo.baseApiId,
        ),
      );

      // Set datasource page to view mode
      yield put(
        setDatasourceViewMode({
          datasourceId: response?.data?.id,
          viewMode: true,
        }),
      );

      // fetch the datasource structure.
      yield put(fetchDatasourceStructure(response?.data?.id, true));

      toast.show(createMessage(DATASOURCE_CREATE, response.data.name), {
        kind: "success",
      });

      if (actionPayload.onSuccess) {
        if (
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (actionPayload.onSuccess.payload as any).datasourceId ===
          TEMP_DATASOURCE_ID
        ) {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (actionPayload.onSuccess.payload as any).datasourceId =
            response.data.id;
        }

        yield put(actionPayload.onSuccess);
      }

      yield put({
        type: ReduxActionTypes.DELETE_DATASOURCE_DRAFT,
        payload: {
          id: TEMP_DATASOURCE_ID,
        },
      });

      // for all datasources, except for REST and GraphQL, need to delete temp datasource data
      // as soon as possible, for REST and GraphQL it is getting deleted in APIPaneSagas.ts
      if (!actionRouteInfo.baseApiId) {
        yield put(removeTempDatasource());
      }

      // updating form initial values to latest data, so that next time when form is opened
      // isDirty will use updated initial values data to compare actual values with
      yield put(initialize(DATASOURCE_DB_FORM, response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_DATASOURCE_ERROR,
      payload: { error },
    });
  }
}

export function* changeDatasourceSaga(
  actionPayload: ReduxAction<{
    datasource: Datasource;
    shouldNotRedirect?: boolean;
  }>,
) {
  const { datasource, shouldNotRedirect } = actionPayload.payload;
  const { id } = datasource;
  const draft: Record<string, unknown> = yield select(getDatasourceDraft, id);
  const currentApplicationIdForCreateNewApp: string | undefined = yield select(
    getCurrentApplicationIdForCreateNewApp,
  );
  let data;

  if (isEmpty(draft)) {
    data = datasource;
  } else {
    data = draft;
  }

  yield put(
    initialize(
      data?.type === PluginType.API
        ? DATASOURCE_REST_API_FORM
        : DATASOURCE_DB_FORM,
      omit(data, ["name"]),
    ),
  );

  // on reconnect modal, it shouldn't be redirected to datasource edit page
  // on create new app onboarding flow, it shouldn't redirect either
  if (shouldNotRedirect || currentApplicationIdForCreateNewApp) return;

  // this redirects to the same route, so checking first.
  const basePageId: string = yield select(getCurrentBasePageId);
  const datasourcePath = trimQueryString(
    datasourcesEditorIdURL({
      basePageId,
      datasourceId: datasource.id,
      generateEditorPath: true,
    }),
  );

  if (history.location.pathname !== datasourcePath)
    history.push(
      datasourcesEditorIdURL({
        basePageId,
        datasourceId: datasource.id,
        params: getQueryParams(),
        generateEditorPath: true,
      }),
    );

  yield put(
    // @ts-expect-error: data is of type unknown
    updateReplayEntity(data.id, omit(data, ["name"]), ENTITY_TYPE.DATASOURCE),
  );
}

export function* switchDatasourceSaga(
  action: ReduxAction<{
    datasourceId: string;
    shouldNotRedirect: boolean;
  }>,
) {
  const { datasourceId, shouldNotRedirect } = action.payload;
  const datasource: Datasource = yield select(getDatasource, datasourceId);

  if (datasource) {
    yield put(changeDatasource({ datasource, shouldNotRedirect }));
  }
}

export function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  const { field, form } = actionPayload.meta;

  if (form === DATASOURCE_REST_API_FORM) {
    const { values } = yield select(getFormData, DATASOURCE_REST_API_FORM);

    if (values && values.datasourceId) {
      yield put(
        updateReplayEntity(values.datasourceId, values, ENTITY_TYPE.DATASOURCE),
      );
    }
  }

  if (form !== DATASOURCE_DB_FORM && form !== DATASOURCE_REST_API_FORM) return;

  if (field === "name") return;

  yield all([call(updateDraftsSaga, form)]);
}

function* updateDraftsSaga(form: string) {
  const values: Record<string, unknown> = yield select(getFormValues(form));

  if (!values?.id) return;

  const datasource: Datasource | undefined = yield select(
    getDatasource,
    // @ts-expect-error: values is of type unknown
    values.id,
  );

  if (!equal(values, datasource)) {
    // @ts-expect-error: values is of type unknown
    yield put(updateReplayEntity(values.id, values, ENTITY_TYPE.DATASOURCE));
  }
}

export function* storeAsDatasourceSaga() {
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
  // const applicationId: string = yield select(getCurrentApplicationId);
  const application: ApplicationPayload = yield select(getCurrentApplication);
  const basePageId: string | undefined = yield select(getCurrentBasePageId);
  const moduleId: string | undefined = yield select(getCurrentModuleId);
  let datasource = get(values, "datasource");

  datasource = omit(datasource, ["name"]);
  const originalHeaders = get(values, "actionConfiguration.headers", []);

  const currentEnvDetails: { id: string; name: string } = yield select(
    getCurrentEnvironmentDetails,
  );
  const currentEnvironment = currentEnvDetails.id;
  const [datasourceHeaders, actionHeaders] = partition(
    originalHeaders,
    ({ key, value }: { key: string; value: string }) => {
      return !(isDynamicValue(key) || isDynamicValue(value));
    },
  );

  yield put(
    setActionProperty({
      actionId: values.id,
      propertyName: "actionConfiguration.headers",
      value: actionHeaders,
    }),
  );

  // Empty Headers getting created so filtering out the empty headers before setting it to datasource
  const filteredDatasourceHeaders = datasourceHeaders.filter(
    (d) => !(d.key === "" && d.key === ""),
  );

  yield put(createTempDatasourceFromForm(datasource));
  const createDatasourceSuccessAction: unknown = yield take(
    ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
  );
  // @ts-expect-error: createDatasourceSuccessAction is of type unknown
  let createdDatasource = createDatasourceSuccessAction.payload;

  set(
    createdDatasource,
    `datasourceStorages.${currentEnvironment}.datasourceConfiguration.headers`,
    filteredDatasourceHeaders,
  );
  set(
    createdDatasource,
    `datasourceStorages.${currentEnvironment}.datasourceConfiguration.url`,
    datasource.datasourceConfiguration.url,
  );
  createdDatasource = omit(createdDatasource, ["datasourceConfiguration"]);
  // Set datasource page to edit mode
  yield put(
    setDatasourceViewMode({
      datasourceId: datasource.id,
      viewMode: false,
    }),
  );

  yield put({
    type: ReduxActionTypes.STORE_AS_DATASOURCE_UPDATE,
    payload: {
      baseApplicationId: application?.baseId,
      baseApiId: values.baseId,
      baseParentEntityId: basePageId || moduleId,
      datasourceId: createdDatasource.id,
    },
  });

  yield put(changeDatasource({ datasource: createdDatasource }));
}

export function* updateDatasourceSuccessSaga(
  action: UpdateDatasourceSuccessAction,
) {
  const state: AppState = yield select();
  const actionRouteInfo = get(state, "ui.datasourcePane.actionRouteInfo");
  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap =
    yield select(getGenerateCRUDEnabledPluginMap);
  const updatedDatasource = action.payload;

  const { queryParams = {} } = action;

  const isGeneratePageInitiator = getIsGeneratePageInitiator(
    queryParams.isGeneratePageMode,
  );

  if (
    actionRouteInfo &&
    updatedDatasource.id === actionRouteInfo.datasourceId &&
    action.redirect
  ) {
    history.push(
      apiEditorIdURL({
        baseParentEntityId: actionRouteInfo.baseParentEntityId || "",
        baseApiId: actionRouteInfo.baseApiId!,
      }),
    );
  }

  yield call(openGeneratePageModalWithSelectedDS, {
    shouldOpenModalWIthSelectedDS: Boolean(
      isGeneratePageInitiator &&
        updatedDatasource.pluginId &&
        generateCRUDSupportedPlugin[updatedDatasource.pluginId],
    ),
    datasourceId: updatedDatasource.id,
  });

  yield put({
    type: ReduxActionTypes.STORE_AS_DATASOURCE_COMPLETE,
  });
}

export function* fetchDatasourceStructureSaga(
  action: ReduxAction<{
    id: string;
    ignoreCache: boolean;
    schemaFetchContext: DatasourceStructureContext;
  }>,
) {
  const isLoadingEnv: boolean = yield select(isEnvironmentFetching);

  if (isLoadingEnv) {
    yield take(ReduxActionTypes.FETCH_ENVIRONMENT_SUCCESS);
  }

  let errorMessage = "";
  let isSuccess = false;

  try {
    const datasource = shouldBeDefined<Datasource>(
      yield select(getDatasource, action.payload.id),
      `Datasource not found for id - ${action.payload.id}`,
    );
    const plugin: Plugin = yield select(getPlugin, datasource?.pluginId);

    try {
      const response: ApiResponse =
        yield DatasourcesApi.fetchDatasourceStructure(
          action.payload.id,
          action.payload.ignoreCache,
        );
      const isValidResponse: boolean = yield validateResponse(response, false);

      if (isValidResponse) {
        yield put({
          type: ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_SUCCESS,
          payload: {
            data: response.data,
            datasourceId: action.payload.id,
          },
        });

        if (isEmpty(response.data)) {
          errorMessage = createMessage(DATASOURCE_SCHEMA_NOT_AVAILABLE);
          AppsmithConsole.warning({
            text: "Datasource structure could not be retrieved",
            source: {
              id: action.payload.id,
              name: datasource.name,
              type: ENTITY_TYPE.DATASOURCE,
            },
          });
        } else {
          isSuccess = true;
          AppsmithConsole.info({
            text: "Datasource structure retrieved",
            source: {
              id: action.payload.id,
              name: datasource.name,
              type: ENTITY_TYPE.DATASOURCE,
            },
          });
        }

        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!!(response.data as any)?.error) {
          isSuccess = false;
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errorMessage = (response.data as any).error?.message;
        }
      }
    } catch (error) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorMessage = (error as any)?.message;
      isSuccess = false;
      yield put({
        type: ReduxActionErrorTypes.FETCH_DATASOURCE_STRUCTURE_ERROR,
        payload: {
          error,
          show: false,
          datasourceId: action.payload.id,
        },
      });
      AppsmithConsole.error({
        text: "Datasource structure could not be retrieved",
        source: {
          id: action.payload.id,
          name: datasource.name,
          type: ENTITY_TYPE.DATASOURCE,
        },
      });
    }

    const currentEnvDetails: { id: string; name: string } = yield select(
      getCurrentEnvironmentDetails,
    );

    AnalyticsUtil.logEvent("DATASOURCE_SCHEMA_FETCH", {
      datasourceId: datasource?.id,
      pluginName: plugin?.name,
      environmentId: currentEnvDetails.id,
      environmentName: currentEnvDetails.name,
      errorMessage: errorMessage,
      isSuccess: isSuccess,
      source: action.payload.schemaFetchContext,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_DATASOURCE_STRUCTURE_ERROR,
      payload: {
        error,
        show: false,
        datasourceId: action.payload.id,
      },
    });
  }
}

export function* addAndFetchDatasourceStructureSaga(
  action: ReduxAction<MockDatasource>,
) {
  const plugin: Plugin = yield select((state: AppState) =>
    getPluginByPackageName(state, action.payload.packageName),
  );

  const workspaceId: string = yield select(getCurrentWorkspaceId);

  yield put(
    addMockDatasourceToWorkspace(
      action.payload.name,
      workspaceId,
      plugin.id,
      plugin.packageName,
      "",
      true,
    ),
  );

  const result: ReduxAction<Datasource> = yield take([
    ReduxActionTypes.ADD_MOCK_DATASOURCES_SUCCESS,
    ReduxActionErrorTypes.ADD_MOCK_DATASOURCES_ERROR,
  ]);

  if (result.type === ReduxActionTypes.ADD_MOCK_DATASOURCES_SUCCESS) {
    yield put(fetchDatasourceStructure(result.payload.id, true));
  }
}

export function* refreshDatasourceStructure(
  action: ReduxAction<{
    id: string;
    schemaRefreshContext: DatasourceStructureContext;
  }>,
) {
  const datasource = shouldBeDefined<Datasource>(
    yield select(getDatasource, action.payload.id),
    `Datasource is not found for it - ${action.payload.id}`,
  );
  const plugin: Plugin = yield select(getPlugin, datasource?.pluginId);
  let errorMessage = "";
  let isSuccess = false;

  try {
    const response: ApiResponse = yield DatasourcesApi.fetchDatasourceStructure(
      action.payload.id,
      true,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_SUCCESS,
        payload: {
          data: response.data,
          datasourceId: action.payload.id,
        },
      });

      if (isEmpty(response.data)) {
        errorMessage = createMessage(DATASOURCE_SCHEMA_NOT_AVAILABLE);
        AppsmithConsole.warning({
          text: "Datasource structure could not be retrieved",
          source: {
            id: action.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      } else {
        isSuccess = true;
        AppsmithConsole.info({
          text: "Datasource structure retrieved",
          source: {
            id: action.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      }

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!!(response.data as any)?.error) {
        isSuccess = false;
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errorMessage = (response.data as any)?.error?.message;
      }
    }
  } catch (error) {
    isSuccess = false;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorMessage = (error as any)?.message;
    yield put({
      type: ReduxActionErrorTypes.REFRESH_DATASOURCE_STRUCTURE_ERROR,
      payload: {
        error,
        show: false,
        datasourceId: action.payload.id,
      },
    });
    AppsmithConsole.error({
      text: "Datasource structure could not be retrieved",
      source: {
        id: action.payload.id,
        name: datasource.name,
        type: ENTITY_TYPE.DATASOURCE,
      },
    });
  }
  const currentEnvDetails: { id: string; name: string } = yield select(
    getCurrentEnvironmentDetails,
  );

  AnalyticsUtil.logEvent("DATASOURCE_SCHEMA_FETCH", {
    datasourceId: datasource?.id,
    pluginName: plugin?.name,
    environmentId: currentEnvDetails.id,
    environmentName: currentEnvDetails.name,
    errorMessage: errorMessage,
    isSuccess: isSuccess,
    source: action.payload.schemaRefreshContext,
  });
}

export function* executeDatasourceQuerySaga(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: executeDatasourceQueryReduxAction<any>,
) {
  try {
    // isGeneratePage value is because we are reusing the same action which calls this saga for both generating the page and fetching preview data
    // We use it to choose the appropriate API to call and the appropriate payload to pass to the API.
    // We are reusing this saga because of its similar flow, and since we do not persist the data to redux state but instead trigger callbacks.
    const response: ApiResponse = action.payload.isGeneratePage
      ? yield DatasourcesApi.executeGoogleSheetsDatasourceQuery(action.payload)
      : yield DatasourcesApi.executeDatasourceQuery({
          data: action.payload?.template,
          datasourceId: action.payload.datasourceId,
        });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.EXECUTE_DATASOURCE_QUERY_SUCCESS,
        payload: {
          data: action.payload.isGeneratePage
            ? // @ts-expect-error: we don't know what the response will be
              response.data?.trigger
            : // @ts-expect-error: we don't know what the response will be
              response.data?.body,
          datasourceId: action.payload.datasourceId,
        },
      });
    }

    if (action.onSuccessCallback) {
      // @ts-expect-error: type mismatch for response
      action.onSuccessCallback(response);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.EXECUTE_DATASOURCE_QUERY_ERROR,
      payload: {
        error,
      },
    });

    if (action.onErrorCallback) {
      if (error instanceof Error) {
        action.onErrorCallback(error.message);
      } else {
        // @ts-expect-error: onErrorCallback expects string
        action.onErrorCallback(error);
      }
    }
  }
}

export function* initializeFormWithDefaults(
  action: ReduxAction<{ pluginType: string }>,
) {
  const formName =
    action?.payload?.pluginType === "API"
      ? DATASOURCE_REST_API_FORM
      : DATASOURCE_DB_FORM;
  const initialValue: Datasource = yield select(getFormInitialValues(formName));
  const defaultKeyValueArrayConfig: string[] = yield select(
    (state) => state?.ui?.datasourcePane?.defaultKeyValueArrayConfig,
  );

  if (
    defaultKeyValueArrayConfig &&
    defaultKeyValueArrayConfig?.length > 0 &&
    !!initialValue
  ) {
    const restAPIFormData: Datasource = yield select(
      getFormValues(DATASOURCE_REST_API_FORM),
    );
    const formData: Datasource = yield select(
      getFormValues(DATASOURCE_DB_FORM),
    );

    const formDataObj: Datasource =
      action?.payload?.pluginType === "API" ? restAPIFormData : formData;

    for (const prop of defaultKeyValueArrayConfig) {
      const propPath: string[] = prop.split("[*].");
      const newValues = get(formDataObj, propPath[0], []);

      set(initialValue, propPath[0], newValues);
    }

    yield put(resetDefaultKeyValPairFlag());
  }
}

export function* filePickerActionCallbackSaga(
  actionPayload: ReduxAction<{
    action: FilePickerActionStatus;
    datasourceId: string;
    fileIds: Array<string>;
  }>,
) {
  try {
    const { action, datasourceId, fileIds } = actionPayload.payload;

    yield put({
      type: ReduxActionTypes.SET_GSHEET_TOKEN,
      payload: {
        gsheetToken: "",
        gsheetProjectID: "",
      },
    });

    const datasourceFromState: Datasource = yield select(
      getDatasource,
      datasourceId,
    );
    const datasource: Datasource = klonaLiteWithTelemetry(
      datasourceFromState,
      "DatasourcesSagas.filePickerActionCallbackSaga",
    );

    const plugin: Plugin = yield select(getPlugin, datasource?.pluginId);
    const applicationId: string = yield select(getCurrentApplicationId);
    const pageId: string = yield select(getCurrentPageId);
    const currentEnvDetails: { id: string; name: string } = yield select(
      getCurrentEnvironmentDetails,
    );

    // update authentication status based on whether files were picked or not
    const authStatus =
      action === FilePickerActionStatus.PICKED
        ? AuthenticationStatus.SUCCESS
        : AuthenticationStatus.FAILURE_FILE_NOT_SELECTED;

    // Once files are selected in case of import, set this flag
    set(
      datasource,
      `datasourceStorages.${currentEnvDetails.id}.datasourceConfiguration.authentication.authenticationStatus`,
      true,
    );

    // auth complete event once the files are selected/not selected
    AnalyticsUtil.logEvent("DATASOURCE_AUTH_COMPLETE", {
      applicationId: applicationId,
      pageId: pageId,
      datasourceId: datasource?.id,
      environmentId: currentEnvDetails.id,
      environmentName: currentEnvDetails.name,
      oAuthPassOrFailVerdict:
        authStatus === AuthenticationStatus.FAILURE_FILE_NOT_SELECTED
          ? createMessage(FILES_NOT_SELECTED_EVENT)
          : authStatus.toLowerCase(),
      workspaceId: datasource?.workspaceId,
      datasourceName: datasource?.name,
      pluginName: plugin?.name,
    });

    // Once users selects/cancels the file selection,
    // Sending sheet ids selected as part of datasource
    // config properties in order to save it in database
    // using the second index specifically for file ids.
    set(
      datasource,
      `datasourceStorages.${currentEnvDetails.id}.datasourceConfiguration.properties[1]`,
      {
        key: createMessage(GSHEET_AUTHORISED_FILE_IDS_KEY),
        value: fileIds,
      },
    );
    yield put(updateDatasourceAuthState(datasource, authStatus));
  } catch (error) {
    yield put({
      type: ReduxActionTypes.SET_GSHEET_TOKEN,
      payload: {
        gsheetToken: "",
        gsheetProjectID: "",
      },
    });
  }
}

export function* fetchGsheetSpreadhsheets(
  action: ReduxAction<{
    datasourceId: string;
    pluginId: string;
  }>,
) {
  let googleSheetEditorConfig: {
    children: [
      {
        initialValue: string;
      },
    ];
  }[] = yield select((state: AppState) =>
    getEditorConfig(state, action.payload.pluginId),
  );

  try {
    if (!googleSheetEditorConfig) {
      yield put(
        fetchPluginFormConfig({
          pluginId: {
            id: action.payload.pluginId,
          },
        }),
      );

      const fetchConfigAction: ReduxAction<unknown> = yield take([
        ReduxActionTypes.FETCH_PLUGIN_FORM_SUCCESS,
        ReduxActionErrorTypes.FETCH_PLUGIN_FORM_ERROR,
      ]);

      if (
        fetchConfigAction.type === ReduxActionErrorTypes.FETCH_PLUGIN_FORM_ERROR
      ) {
        throw new Error("Unable to fetch plugin form config");
      }

      googleSheetEditorConfig = yield select((state: AppState) =>
        getEditorConfig(state, action.payload.pluginId),
      );
    }

    const requestObject: Record<string, string> = {};

    if (googleSheetEditorConfig && googleSheetEditorConfig[0]) {
      const configs = googleSheetEditorConfig[0]?.children;

      if (Array.isArray(configs)) {
        for (let index = 0; index < configs.length; index += 2) {
          const keyConfig = configs[index];
          const valueConfig = configs[index + 1];

          if (keyConfig && valueConfig) {
            const key = keyConfig?.initialValue;
            const value = valueConfig?.initialValue;

            if (key && value !== undefined) requestObject[key] = value;
          }
        }
      }
    }

    const data = {
      datasourceId: action.payload.datasourceId,
      displayType: "DROP_DOWN",
      pluginId: action.payload.pluginId,
      requestType: "SPREADSHEET_SELECTOR",
      ...requestObject,
    };

    const response: ApiResponse =
      yield DatasourcesApi.executeGoogleSheetsDatasourceQuery({
        datasourceId: action.payload.datasourceId,
        data,
      });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_GSHEET_SPREADSHEETS_SUCCESS,
        payload: {
          id: action.payload.datasourceId,
          // @ts-expect-error: type mismatch for response
          data: response.data?.trigger,
        },
      });
    }
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    yield put({
      type: ReduxActionTypes.FETCH_GSHEET_SPREADSHEETS_FAILURE,
      payload: {
        id: action.payload.datasourceId,
        error: error.message,
      },
    });
  }
}

export function* fetchGsheetSheets(
  action: ReduxAction<{
    datasourceId: string;
    pluginId: string;
    sheetUrl: string;
  }>,
) {
  try {
    const data = {
      datasourceId: action.payload.datasourceId,
      displayType: "DROP_DOWN",
      parameters: {
        sheetUrl: action.payload.sheetUrl,
      },
      pluginId: action.payload.pluginId,
      requestType: "SHEET_SELECTOR",
    };

    const response: ApiResponse =
      yield DatasourcesApi.executeGoogleSheetsDatasourceQuery({
        datasourceId: action.payload.datasourceId,
        data,
      });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_GSHEET_SHEETS_SUCCESS,
        payload: {
          // @ts-expect-error: type mismatch for response
          data: response.data?.trigger,
          id: action.payload.sheetUrl,
        },
      });
    }
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    yield put({
      type: ReduxActionTypes.FETCH_GSHEET_SHEETS_FAILURE,
      payload: {
        id: action.payload.sheetUrl,
        error: error.message,
      },
    });
  }
}

export function* fetchGsheetColumns(
  action: ReduxAction<{
    datasourceId: string;
    pluginId: string;
    sheetName: string;
    sheetUrl: string;
    headerIndex: number;
  }>,
) {
  try {
    const data = {
      datasourceId: action.payload.datasourceId,
      displayType: "DROP_DOWN",
      parameters: {
        sheetName: action.payload.sheetName,
        sheetUrl: action.payload.sheetUrl,
        tableHeaderIndex: action.payload.headerIndex,
      },
      pluginId: action.payload.pluginId,
      requestType: "COLUMNS_SELECTOR",
    };

    const response: ApiResponse =
      yield DatasourcesApi.executeGoogleSheetsDatasourceQuery({
        datasourceId: action.payload.datasourceId,
        data,
      });
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_GSHEET_COLUMNS_SUCCESS,
        payload: {
          // @ts-expect-error: type mismatch for response
          data: response.data?.trigger,
          id: action.payload.sheetName + "_" + action.payload.sheetUrl,
        },
      });
    }
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    yield put({
      type: ReduxActionTypes.FETCH_GSHEET_COLUMNS_FAILURE,
      payload: {
        id: action.payload.sheetName + "_" + action.payload.sheetUrl,
        error: error.message,
      },
    });
  }
}

export function* loadFilePickerSaga() {
  // This adds overlay on document body
  // This is done for google sheets file picker, as file picker needs to be shown on blank page
  // when overlay needs to be shown, we get showPicker search param in redirect url
  yield executeGoogleApi();
  const appsmithToken = localStorage.getItem(APPSMITH_TOKEN_STORAGE_KEY);
  const search = new URLSearchParams(window.location.search);
  const isShowFilePicker = search.get(SHOW_FILE_PICKER_KEY);
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gapiScriptLoaded = (window as any).googleAPIsLoaded;
  const authStatus = search.get(RESPONSE_STATUS);

  if (
    !!isShowFilePicker &&
    !!authStatus &&
    authStatus === AuthorizationStatus.SUCCESS &&
    !!appsmithToken &&
    !!gapiScriptLoaded
  ) {
    addClassToDocumentRoot(GOOGLE_SHEET_FILE_PICKER_OVERLAY_CLASS);
  }
}

export function* updateDatasourceAuthStateSaga(
  actionPayload: ReduxAction<{
    authStatus: AuthenticationStatus;
    datasource: Datasource;
  }>,
) {
  try {
    const { authStatus, datasource } = actionPayload.payload;
    const currentEnvironment: string = yield select(
      getCurrentEditingEnvironmentId,
    );

    set(
      datasource,
      `datasourceStorages.${currentEnvironment}.datasourceConfiguration.authentication.authenticationStatus`,
      authStatus,
    );
    const response: ApiResponse<Datasource> =
      yield DatasourcesApi.updateDatasourceStorage(
        datasource.datasourceStorages[currentEnvironment],
      );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS,
        payload: response.data,
      });
      toast.show(
        authStatus === AuthenticationStatus.SUCCESS
          ? OAUTH_AUTHORIZATION_SUCCESSFUL
          : OAUTH_AUTHORIZATION_FAILED,
        {
          kind:
            authStatus === AuthenticationStatus.SUCCESS ? "success" : "error",
        },
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_DATASOURCE_ERROR,
      payload: {
        error: {
          message: OAUTH_AUTHORIZATION_FAILED,
        },
        show: true,
      },
    });
  }
}

export function* datasourceDiscardActionSaga(
  actionPayload: ReduxAction<{
    pluginId: string;
  }>,
) {
  const { pluginId } = actionPayload.payload;
  const plugin: Plugin = yield select(getPlugin, pluginId);
  const formName: string = getFormName(plugin);
  const formData: GetFormData = yield select(getFormData, formName);
  const formDiffPaths: string[] = getFormDiffPaths(
    formData.initialValues,
    formData.values,
  );

  AnalyticsUtil.logEvent("DISCARD_DATASOURCE_CHANGES", {
    pluginName: plugin?.name,
    editedFields: formDiffPaths,
  });
}

export function* setDatasourceViewModeSaga(
  action: ReduxAction<{ datasourceId: string; viewMode: boolean }>,
) {
  //Set the view mode flag in store
  yield put(setDatasourceViewModeFlag(action.payload.viewMode));
  //Reset the banner message for the datasource
  yield put({
    type: ReduxActionTypes.RESET_DATASOURCE_BANNER_MESSAGE,
    payload: action.payload.datasourceId,
  });
}
