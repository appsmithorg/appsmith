/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  all,
  call,
  fork,
  put,
  select,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
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
  ApplicationPayload,
  ReduxAction,
  ReduxActionWithCallbacks,
  ReduxActionWithMeta,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxFormActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getDatasource,
  getDatasourceActionRouteInfo,
  getDatasourceDraft,
  getDatasources,
  getDatasourcesUsedInApplicationByActions,
  getEditorConfig,
  getEntityExplorerDatasources,
  getGenerateCRUDEnabledPluginMap,
  getPlugin,
  getPluginByPackageName,
  getPluginForm,
  getPluginPackageFromDatasourceId,
} from "@appsmith/selectors/entitiesSelector";
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
  ToastMessageType,
} from "entities/Datasource";
import {
  INTEGRATION_EDITOR_MODES,
  INTEGRATION_TABS,
  RESPONSE_STATUS,
  SHOW_FILE_PICKER_KEY,
} from "constants/routes";
import history from "utils/history";
import {
  API_EDITOR_FORM_NAME,
  DATASOURCE_DB_FORM,
  DATASOURCE_REST_API_FORM,
} from "@appsmith/constants/forms";
import { validateResponse } from "./ErrorSagas";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { GetFormData } from "selectors/formSelectors";
import { getFormData } from "selectors/formSelectors";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
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
} from "@appsmith/constants/messages";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import localStorage from "utils/localStorage";
import log from "loglevel";
import { APPSMITH_TOKEN_STORAGE_KEY } from "pages/Editor/SaaSEditor/constants";
import { checkAndGetPluginFormConfigsSaga } from "sagas/PluginSagas";
import { PluginPackageName, PluginType } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { getQueryParams } from "utils/URLUtils";
import type { GenerateCRUDEnabledPluginMap, Plugin } from "api/PluginApi";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { shouldBeDefined, trimQueryString } from "utils/helpers";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { updateReplayEntity } from "actions/pageActions";
import OAuthApi from "api/OAuthApi";
import type { AppState } from "@appsmith/reducers";
import {
  getApplicationByIdFromWorkspaces,
  getCurrentApplicationIdForCreateNewApp,
  getWorkspaceIdForImport,
} from "@appsmith/selectors/applicationSelectors";
import {
  apiEditorIdURL,
  datasourcesEditorIdURL,
  generateTemplateFormURL,
  integrationEditorURL,
  saasEditorDatasourceIdURL,
} from "@appsmith/RouteBuilder";
import {
  DATASOURCE_NAME_DEFAULT_PREFIX,
  GOOGLE_SHEET_FILE_PICKER_OVERLAY_CLASS,
  GOOGLE_SHEET_SPECIFIC_SHEETS_SCOPE,
  TEMP_DATASOURCE_ID,
} from "constants/Datasource";
import { getUntitledDatasourceSequence } from "utils/DatasourceSagaUtils";
import { toast } from "design-system";
import { fetchPluginFormConfig } from "actions/pluginActions";
import { addClassToDocumentRoot } from "pages/utils";
import { AuthorizationStatus } from "pages/common/datasourceAuth";
import {
  getFormDiffPaths,
  getFormName,
  isGoogleSheetPluginDS,
} from "utils/editorContextUtils";
import { getDefaultEnvId } from "@appsmith/api/ApiUtils";
import { MAX_DATASOURCE_SUGGESTIONS } from "@appsmith/pages/Editor/Explorer/hooks";
import { klona } from "klona/lite";
import {
  getCurrentEditingEnvironmentId,
  getCurrentEnvironmentDetails,
} from "@appsmith/selectors/environmentSelectors";
import { waitForFetchEnvironments } from "@appsmith/sagas/EnvironmentSagas";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";

function* fetchDatasourcesSaga(
  action: ReduxAction<{ workspaceId?: string } | undefined>,
) {
  try {
    let workspaceId: string = yield select(getCurrentWorkspaceId);
    if (action.payload?.workspaceId) workspaceId = action.payload?.workspaceId;

    const response: ApiResponse<Datasource[]> =
      yield DatasourcesApi.fetchDatasources(workspaceId);
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

function* handleFetchDatasourceStructureOnLoad() {
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

function* fetchMockDatasourcesSaga() {
  try {
    const response: ApiResponse = yield DatasourcesApi.fetchMockDatasources();
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
    const pageId: string = !!currentApplicationIdForCreateNewApp
      ? application?.defaultPageId
      : yield select(getCurrentPageId);
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

      const isInGuidedTour: boolean = yield select(inGuidedTour);

      if (isGeneratePageInitiator) {
        history.push(
          generateTemplateFormURL({
            pageId,
            params: {
              datasourceId: response.data.id,
            },
          }),
        );
      } else {
        if (isInGuidedTour || skipRedirection) {
          return;
        }

        let url = "";
        const plugin: Plugin = yield select(getPlugin, response.data.pluginId);
        if (plugin && plugin.type === PluginType.SAAS) {
          url = saasEditorDatasourceIdURL({
            pageId,
            pluginPackageName: plugin.packageName,
            datasourceId: response.data.id,
            params: {
              viewMode: true,
            },
          });
        } else {
          url = datasourcesEditorIdURL({
            pageId,
            datasourceId: response.data.id,
            params: omit(getQueryParams(), "viewMode"),
          });
        }
        history.push(url);
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.ADD_MOCK_DATASOURCES_ERROR,
      payload: { error },
    });
  }
}

export function* deleteDatasourceSaga(
  actionPayload: ReduxActionWithCallbacks<{ id: string }, unknown, unknown>,
) {
  try {
    const id = actionPayload.payload.id;
    const response: ApiResponse<Datasource> =
      yield DatasourcesApi.deleteDatasource(id);
    const pageId: string = yield select(getCurrentPageId);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const pluginPackageName = shouldBeDefined<string>(
        yield select((state: AppState) =>
          getPluginPackageFromDatasourceId(state, id),
        ),
        `Plugin package not found for the given id - ${id}`,
      );
      const datasourcePathWithoutQuery = trimQueryString(
        datasourcesEditorIdURL({
          pageId,
          datasourceId: id,
        }),
      );

      const saasPathWithoutQuery = trimQueryString(
        saasEditorDatasourceIdURL({
          pageId,
          pluginPackageName,
          datasourceId: id,
        }),
      );

      if (
        window.location.pathname === datasourcePathWithoutQuery ||
        window.location.pathname === saasPathWithoutQuery
      ) {
        history.push(
          integrationEditorURL({
            pageId,
            selectedTab: INTEGRATION_TABS.NEW,
            params: {
              ...getQueryParams(),
              mode: INTEGRATION_EDITOR_MODES.AUTO,
            },
          }),
        );
      }

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
    toast.show((error as Error).message, {
      kind: "error",
    });
    yield put({
      type: ReduxActionErrorTypes.DELETE_DATASOURCE_ERROR,
      payload: { error, id: actionPayload.payload.id, show: false },
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

function* updateDatasourceSaga(
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
        if (pluginPackageName !== PluginPackageName.GOOGLE_SHEETS) {
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

function* redirectAuthorizationCodeSaga(
  actionPayload: ReduxAction<{
    datasourceId: string;
    pageId: string;
    pluginType: PluginType;
  }>,
) {
  const { datasourceId, pageId, pluginType } = actionPayload.payload;
  const isImport: string = yield select(getWorkspaceIdForImport);
  const branchName: string | undefined = yield select(getCurrentGitBranch);

  if (pluginType === PluginType.API) {
    const currentEnvironment: string = yield select(
      getCurrentEditingEnvironmentId,
    );
    let windowLocation = `/api/v1/datasources/${datasourceId}/pages/${pageId}/code?environmentId=${currentEnvironment}`;
    if (!!branchName) {
      windowLocation = windowLocation + `&branchName=` + branchName;
    }
    window.location.href = windowLocation;
  } else {
    try {
      // Get an "appsmith token" from the server
      const response: ApiResponse<string> = yield OAuthApi.getAppsmithToken(
        datasourceId,
        pageId,
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

function* getOAuthAccessTokenSaga(
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
    toast.show(OAUTH_AUTHORIZATION_APPSMITH_ERROR, {
      kind: "error",
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
    }
  } catch (e) {
    toast.show(OAUTH_AUTHORIZATION_FAILED, {
      kind: "error",
    });
    log.error(e);
  }
}

function* updateDatasourceNameSaga(
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

function* handleDatasourceNameChangeFailureSaga(
  action: ReduxAction<{ oldName: string }>,
) {
  yield put(change(DATASOURCE_DB_FORM, "name", action.payload.oldName));
}

function* testDatasourceSaga(actionPayload: ReduxAction<Datasource>) {
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
          datasoureId: datasource?.id,
          environmentId: currentEnvironment,
          environmentName: currentEnvDetails.name,
          pluginName: plugin?.name,
          errorMessages: responseData.invalids,
          messages: responseData.messages,
        });
        responseData.invalids.forEach((message: string) => {
          toast.show(message, {
            kind: "error",
          });
        });
        yield put({
          type: ReduxActionErrorTypes.TEST_DATASOURCE_ERROR,
          payload: {
            show: false,
            id: datasource.id,
            environmentId: currentEnvironment,
            messages: messages,
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

function* createTempDatasourceFromFormSaga(
  actionPayload: ReduxAction<CreateDatasourceConfig | Datasource>,
) {
  yield call(checkAndGetPluginFormConfigsSaga, actionPayload.payload.pluginId);
  const formConfig: Record<string, any>[] = yield select(
    getPluginForm,
    actionPayload.payload.pluginId,
  );
  const initialValues: unknown = yield call(getConfigInitialValues, formConfig);

  const dsList: Datasource[] = yield select(getDatasources);
  const sequence = getUntitledDatasourceSequence(dsList);

  let datasourceType = actionPayload?.payload?.type;

  if (!actionPayload?.payload.type) {
    const plugin: Plugin = yield select(
      getPlugin,
      actionPayload?.payload.pluginId,
    );
    datasourceType = plugin?.type;
  }

  const defaultEnvId = getDefaultEnvId();

  const initialPayload = {
    id: TEMP_DATASOURCE_ID,
    name: DATASOURCE_NAME_DEFAULT_PREFIX + sequence,
    type: datasourceType,
    pluginId: actionPayload.payload.pluginId,
    new: false,
    datasourceStorages: {
      [defaultEnvId]: {
        datasourceId: TEMP_DATASOURCE_ID,
        environmentId: defaultEnvId,
        isValid: false,
        datasourceConfiguration: {
          properties: [],
        },
        toastMessage: ToastMessageType.EMPTY_TOAST_MESSAGE,
      },
    },
  };
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

function* createDatasourceFromFormSaga(
  actionPayload: ReduxActionWithCallbacks<Datasource, unknown, unknown>,
) {
  try {
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    const actionRouteInfo: Partial<{
      apiId: string;
      datasourceId: string;
      pageId: string;
      applicationId: string;
    }> = yield select(getDatasourceActionRouteInfo);
    yield call(
      checkAndGetPluginFormConfigsSaga,
      actionPayload.payload.pluginId,
    );
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
        createDatasourceSuccess(response.data, true, !!actionRouteInfo.apiId),
      );

      // fetch the datasource structure.
      yield put(fetchDatasourceStructure(response?.data?.id, true));

      toast.show(createMessage(DATASOURCE_CREATE, response.data.name), {
        kind: "success",
      });

      if (actionPayload.onSuccess) {
        if (
          (actionPayload.onSuccess.payload as any).datasourceId ===
          TEMP_DATASOURCE_ID
        ) {
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
      if (!actionRouteInfo.apiId) {
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

function* changeDatasourceSaga(
  actionPayload: ReduxAction<{
    datasource: Datasource;
    shouldNotRedirect?: boolean;
  }>,
) {
  const { datasource, shouldNotRedirect } = actionPayload.payload;
  const { id } = datasource;
  const draft: Record<string, unknown> = yield select(getDatasourceDraft, id);
  const pageId: string = yield select(getCurrentPageId);
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
  if (shouldNotRedirect) return;
  // this redirects to the same route, so checking first.
  const datasourcePath = trimQueryString(
    datasourcesEditorIdURL({
      pageId,
      datasourceId: datasource.id,
    }),
  );

  if (history.location.pathname !== datasourcePath)
    history.push(
      datasourcesEditorIdURL({
        pageId,
        datasourceId: datasource.id,
        params: getQueryParams(),
      }),
    );
  yield put(
    // @ts-expect-error: data is of type unknown
    updateReplayEntity(data.id, omit(data, ["name"]), ENTITY_TYPE.DATASOURCE),
  );
}

function* switchDatasourceSaga(
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

function* formValueChangeSaga(
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

function* storeAsDatasourceSaga() {
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
  const applicationId: string = yield select(getCurrentApplicationId);
  const pageId: string | undefined = yield select(getCurrentPageId);
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
      pageId,
      applicationId,
      apiId: values.id,
      datasourceId: createdDatasource.id,
    },
  });

  yield put(changeDatasource({ datasource: createdDatasource }));
}

function* updateDatasourceSuccessSaga(action: UpdateDatasourceSuccessAction) {
  const state: AppState = yield select();
  const actionRouteInfo = get(state, "ui.datasourcePane.actionRouteInfo");
  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap =
    yield select(getGenerateCRUDEnabledPluginMap);
  const pageId: string = yield select(getCurrentPageId);
  const updatedDatasource = action.payload;

  const { queryParams = {} } = action;

  const isGeneratePageInitiator = getIsGeneratePageInitiator(
    queryParams.isGeneratePageMode,
  );

  if (
    isGeneratePageInitiator &&
    updatedDatasource.pluginId &&
    generateCRUDSupportedPlugin[updatedDatasource.pluginId]
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
    actionRouteInfo &&
    updatedDatasource.id === actionRouteInfo.datasourceId &&
    action.redirect
  ) {
    history.push(
      apiEditorIdURL({
        pageId: actionRouteInfo.pageId!,
        apiId: actionRouteInfo.apiId!,
      }),
    );
  }

  yield put({
    type: ReduxActionTypes.STORE_AS_DATASOURCE_COMPLETE,
  });
}

function* fetchDatasourceStructureSaga(
  action: ReduxAction<{
    id: string;
    ignoreCache: boolean;
    schemaFetchContext: DatasourceStructureContext;
  }>,
) {
  const datasource = shouldBeDefined<Datasource>(
    yield select(getDatasource, action.payload.id),
    `Datasource not found for id - ${action.payload.id}`,
  );
  const plugin: Plugin = yield select(getPlugin, datasource?.pluginId);
  let errorMessage = "";
  let isSuccess = false;

  try {
    const response: ApiResponse = yield DatasourcesApi.fetchDatasourceStructure(
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
      if (!!(response.data as any)?.error) {
        errorMessage = (response.data as any).error?.message;
      }
    }
  } catch (error) {
    errorMessage = (error as any)?.message;
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
}

function* addAndFetchDatasourceStructureSaga(
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

function* refreshDatasourceStructure(
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
      if (!!(response.data as any)?.error) {
        errorMessage = (response.data as any)?.message;
      }
    }
  } catch (error) {
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

function* executeDatasourceQuerySaga(
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

function* initializeFormWithDefaults(
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

function* filePickerActionCallbackSaga(
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
    const datasource: Datasource = klona(datasourceFromState);
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

function* fetchGsheetSpreadhsheets(
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

function* fetchGsheetSheets(
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

function* fetchGsheetColumns(
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

function* loadFilePickerSaga() {
  // This adds overlay on document body
  // This is done for google sheets file picker, as file picker needs to be shown on blank page
  // when overlay needs to be shown, we get showPicker search param in redirect url
  const appsmithToken = localStorage.getItem(APPSMITH_TOKEN_STORAGE_KEY);
  const search = new URLSearchParams(window.location.search);
  const isShowFilePicker = search.get(SHOW_FILE_PICKER_KEY);
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

function* updateDatasourceAuthStateSaga(
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
      payload: { error },
    });
    toast.show(OAUTH_AUTHORIZATION_FAILED, {
      kind: "error",
    });
  }
}

function* datasourceDiscardActionSaga(
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

function* setDatasourceViewModeSaga(
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

export function* watchDatasourcesSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_DATASOURCES_INIT, fetchDatasourcesSaga),
    takeEvery(
      ReduxActionTypes.FETCH_MOCK_DATASOURCES_INIT,
      fetchMockDatasourcesSaga,
    ),
    takeEvery(
      ReduxActionTypes.ADD_MOCK_DATASOURCES_INIT,
      addMockDbToDatasources,
    ),
    takeEvery(
      ReduxActionTypes.CREATE_DATASOURCE_FROM_FORM_INIT,
      createDatasourceFromFormSaga,
    ),
    takeEvery(
      ReduxActionTypes.CREATE_TEMP_DATASOURCE_FROM_FORM_SUCCESS,
      createTempDatasourceFromFormSaga,
    ),
    takeEvery(ReduxActionTypes.UPDATE_DATASOURCE_INIT, updateDatasourceSaga),
    takeEvery(
      ReduxActionTypes.UPDATE_DATASOURCE_NAME,
      updateDatasourceNameSaga,
    ),
    takeEvery(
      ReduxActionErrorTypes.UPDATE_DATASOURCE_NAME_ERROR,
      handleDatasourceNameChangeFailureSaga,
    ),
    takeEvery(ReduxActionTypes.TEST_DATASOURCE_INIT, testDatasourceSaga),
    takeEvery(ReduxActionTypes.DELETE_DATASOURCE_INIT, deleteDatasourceSaga),
    takeEvery(ReduxActionTypes.CHANGE_DATASOURCE, changeDatasourceSaga),
    takeLatest(ReduxActionTypes.SWITCH_DATASOURCE, switchDatasourceSaga),
    takeEvery(ReduxActionTypes.STORE_AS_DATASOURCE_INIT, storeAsDatasourceSaga),
    takeEvery(
      ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS,
      updateDatasourceSuccessSaga,
    ),
    takeEvery(
      ReduxActionTypes.REDIRECT_AUTHORIZATION_CODE,
      redirectAuthorizationCodeSaga,
    ),
    takeEvery(ReduxActionTypes.GET_OAUTH_ACCESS_TOKEN, getOAuthAccessTokenSaga),
    takeEvery(
      ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_INIT,
      fetchDatasourceStructureSaga,
    ),
    takeEvery(
      ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_INIT,
      refreshDatasourceStructure,
    ),
    takeEvery(
      ReduxActionTypes.EXECUTE_DATASOURCE_QUERY_INIT,
      executeDatasourceQuerySaga,
    ),
    takeEvery(
      ReduxActionTypes.INITIALIZE_DATASOURCE_FORM_WITH_DEFAULTS,
      initializeFormWithDefaults,
    ),
    // Intercepting the redux-form change actionType to update drafts and track change history
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_PUSH, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
    takeEvery(
      ReduxActionTypes.FILE_PICKER_CALLBACK_ACTION,
      filePickerActionCallbackSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_GSHEET_SPREADSHEETS,
      fetchGsheetSpreadhsheets,
    ),
    takeLatest(ReduxActionTypes.FETCH_GSHEET_SHEETS, fetchGsheetSheets),
    takeLatest(ReduxActionTypes.FETCH_GSHEET_COLUMNS, fetchGsheetColumns),
    takeEvery(ReduxActionTypes.LOAD_FILE_PICKER_ACTION, loadFilePickerSaga),
    takeEvery(
      ReduxActionTypes.UPDATE_DATASOURCE_AUTH_STATE,
      updateDatasourceAuthStateSaga,
    ),
    takeEvery(
      ReduxActionTypes.DATASOURCE_DISCARD_ACTION,
      datasourceDiscardActionSaga,
    ),
    takeEvery(
      ReduxActionTypes.ADD_AND_FETCH_MOCK_DATASOURCE_STRUCTURE_INIT,
      addAndFetchDatasourceStructureSaga,
    ),
    takeEvery(
      ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
      handleFetchDatasourceStructureOnLoad,
    ),
    takeEvery(
      ReduxActionTypes.SOFT_REFRESH_DATASOURCE_STRUCTURE,
      handleFetchDatasourceStructureOnLoad,
    ),
    takeEvery(
      ReduxActionTypes.SET_DATASOURCE_EDITOR_MODE,
      setDatasourceViewModeSaga,
    ),
    takeEvery(
      ReduxActionTypes.SOFT_REFRESH_DATASOURCE_STRUCTURE,
      handleFetchDatasourceStructureOnLoad,
    ),
    takeEvery(
      ReduxActionTypes.SET_DATASOURCE_EDITOR_MODE,
      setDatasourceViewModeSaga,
    ),
  ]);
}
