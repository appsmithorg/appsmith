import {
  all,
  call,
  put,
  select,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import { change, getFormValues, initialize } from "redux-form";
import _, { merge, isEmpty } from "lodash";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithCallbacks,
  ReduxActionWithMeta,
  ReduxFormActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getDatasource,
  getDatasourceDraft,
  getPluginForm,
  getGenerateCRUDEnabledPluginMap,
  getPluginPackageFromDatasourceId,
} from "selectors/entitiesSelector";
import {
  changeDatasource,
  createDatasourceFromForm,
  fetchDatasourceStructure,
  setDatsourceEditorMode,
  updateDatasourceSuccess,
  UpdateDatasourceSuccessAction,
  executeDatasourceQueryReduxAction,
} from "actions/datasourceActions";
import { ApiResponse } from "api/ApiResponses";
import DatasourcesApi, { CreateDatasourceConfig } from "api/DatasourcesApi";
import { Datasource } from "entities/Datasource";

import { INTEGRATION_EDITOR_MODES, INTEGRATION_TABS } from "constants/routes";
import history from "utils/history";
import {
  API_EDITOR_FORM_NAME,
  DATASOURCE_DB_FORM,
  DATASOURCE_REST_API_FORM,
} from "constants/forms";
import { validateResponse } from "./ErrorSagas";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getFormData } from "selectors/formSelectors";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { getConfigInitialValues } from "components/formControls/utils";
import { setActionProperty } from "actions/pluginActionActions";
import { authorizeDatasourceWithAppsmithToken } from "api/CloudServicesApi";
import {
  createMessage,
  DATASOURCE_CREATE,
  DATASOURCE_DELETE,
  DATASOURCE_UPDATE,
  DATASOURCE_VALID,
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
import { PluginType } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { getQueryParams } from "utils/AppsmithUtils";
import { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { shouldBeDefined, trimQueryString } from "utils/helpers";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { updateReplayEntity } from "actions/pageActions";
import OAuthApi from "api/OAuthApi";
import { AppState } from "reducers";
import { getWorkspaceIdForImport } from "selectors/applicationSelectors";
import {
  apiEditorIdURL,
  datasourcesEditorIdURL,
  generateTemplateFormURL,
  integrationEditorURL,
  saasEditorDatasourceIdURL,
} from "RouteBuilder";

function* fetchDatasourcesSaga(
  action: ReduxAction<{ workspaceId?: string } | undefined>,
) {
  try {
    let workspaceId: string = yield select(getCurrentWorkspaceId);
    if (action.payload?.workspaceId) workspaceId = action.payload?.workspaceId;

    const response: ApiResponse<Datasource[]> = yield DatasourcesApi.fetchDatasources(
      workspaceId,
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
    },
    unknown,
    unknown
  > {
  extraParams?: any;
}

export function* addMockDbToDatasources(actionPayload: addMockDb) {
  try {
    const { name, packageName, pluginId, workspaceId } = actionPayload.payload;
    const { isGeneratePageMode } = actionPayload.extraParams;
    const response: ApiResponse = yield DatasourcesApi.addMockDbToDatasources(
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
      // @ts-expect-error: response is of type unknown
      yield call(checkAndGetPluginFormConfigsSaga, response.data.pluginId);
      const isGeneratePageInitiator = getIsGeneratePageInitiator(
        isGeneratePageMode,
      );
      const isInGuidedTour: boolean = yield select(inGuidedTour);
      if (isGeneratePageInitiator) {
        history.push(
          generateTemplateFormURL({
            params: {
              // @ts-expect-error: response.data is of type unknown
              datasourceId: response.data.id,
            },
          }),
        );
      } else {
        if (isInGuidedTour) return;
        history.push(
          integrationEditorURL({
            selectedTab: INTEGRATION_TABS.ACTIVE,
            params: getQueryParams(),
          }),
        );
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
    const response: ApiResponse<Datasource> = yield DatasourcesApi.deleteDatasource(
      id,
    );

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
          datasourceId: id,
        }),
      );

      const saasPathWithoutQuery = trimQueryString(
        saasEditorDatasourceIdURL({
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
            selectedTab: INTEGRATION_TABS.NEW,
            params: {
              ...getQueryParams(),
              mode: INTEGRATION_EDITOR_MODES.AUTO,
            },
          }),
        );
      }

      Toaster.show({
        text: createMessage(DATASOURCE_DELETE, response.data.name),
        variant: Variant.success,
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
    Toaster.show({
      text: (error as Error).message,
      variant: Variant.danger,
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

function* updateDatasourceSaga(
  actionPayload: ReduxActionWithCallbacks<Datasource, unknown, unknown>,
) {
  try {
    const queryParams = getQueryParams();
    const datasourcePayload = _.omit(actionPayload.payload, "name");
    datasourcePayload.isConfigured = true; // when clicking save button, it should be changed as configured
    const response: ApiResponse<Datasource> = yield DatasourcesApi.updateDatasource(
      datasourcePayload,
      datasourcePayload.id,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      AnalyticsUtil.logEvent("SAVE_DATA_SOURCE", {
        datasourceName: response.data.name,
      });
      Toaster.show({
        text: createMessage(DATASOURCE_UPDATE, response.data.name),
        variant: Variant.success,
      });

      const state: AppState = yield select();
      const expandDatasourceId = state.ui.datasourcePane.expandDatasourceId;
      const datasourceStructure =
        state.entities.datasources.structure[response.data.id];

      // Dont redirect if action payload has an onSuccess
      yield put(
        updateDatasourceSuccess(
          response.data,
          !actionPayload.onSuccess,
          queryParams,
        ),
      );
      yield put(
        setDatsourceEditorMode({ id: datasourcePayload.id, viewMode: true }),
      );
      yield put({
        type: ReduxActionTypes.DELETE_DATASOURCE_DRAFT,
        payload: {
          id: response.data.id,
        },
      });
      if (actionPayload.onSuccess) {
        yield put(actionPayload.onSuccess);
      }
      if (expandDatasourceId === response.data.id && !datasourceStructure) {
        yield put(fetchDatasourceStructure(response.data.id));
      }

      AppsmithConsole.info({
        text: "Datasource configuration saved",
        source: {
          id: response.data.id,
          name: response.data.name,
          type: ENTITY_TYPE.DATASOURCE,
        },
        state: {
          datasourceConfiguration: response.data.datasourceConfiguration,
        },
      });
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

  if (pluginType === PluginType.API) {
    window.location.href = `/api/v1/datasources/${datasourceId}/pages/${pageId}/code`;
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
      Toaster.show({
        text: OAUTH_AUTHORIZATION_FAILED,
        variant: Variant.danger,
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
  if (!appsmithToken) {
    // Error out because auth token should been here
    log.error(OAUTH_APPSMITH_TOKEN_NOT_FOUND);
    Toaster.show({
      text: OAUTH_AUTHORIZATION_APPSMITH_ERROR,
      variant: Variant.danger,
    });
    return;
  }
  try {
    // Get access token for datasource
    const response: ApiResponse<Datasource> = yield OAuthApi.getAccessToken(
      datasourceId,
      appsmithToken,
    );
    if (validateResponse(response)) {
      // Update the datasource object
      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS,
        payload: response.data,
      });
      Toaster.show({
        text: OAUTH_AUTHORIZATION_SUCCESSFUL,
        variant: Variant.success,
      });
      // Remove the token because it is supposed to be short lived
      localStorage.removeItem(APPSMITH_TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    Toaster.show({
      text: OAUTH_AUTHORIZATION_FAILED,
      variant: Variant.danger,
    });
    log.error(e);
  }
}

function* saveDatasourceNameSaga(
  actionPayload: ReduxAction<{ id: string; name: string }>,
) {
  try {
    const response: ApiResponse<Datasource> = yield DatasourcesApi.updateDatasource(
      {
        name: actionPayload.payload.name,
      },
      actionPayload.payload.id,
    );

    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.SAVE_DATASOURCE_NAME_SUCCESS,
        payload: { ...response.data },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_DATASOURCE_NAME_ERROR,
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
  const { initialValues, values } = yield select(
    getFormData,
    DATASOURCE_DB_FORM,
  );
  const datasource = shouldBeDefined<Datasource>(
    yield select(getDatasource, actionPayload.payload.id),
    `Datasource not found for id - ${actionPayload.payload.id}`,
  );
  const payload = {
    ...actionPayload.payload,
    name: datasource.name,
    id: actionPayload.payload.id as any,
  };

  if (!_.isEqual(initialValues, values)) {
    delete payload.id;
  }

  try {
    const response: ApiResponse<Datasource> = yield DatasourcesApi.testDatasource(
      {
        ...payload,
        workspaceId,
      },
    );
    const isValidResponse: boolean = yield validateResponse(response);
    let messages: Array<string> = [];
    if (isValidResponse) {
      const responseData = response.data;
      if (
        (responseData.invalids && responseData.invalids.length) ||
        (responseData.messages && responseData.messages.length)
      ) {
        if (responseData.invalids && responseData.invalids.length) {
          Toaster.show({
            text: responseData.invalids[0],
            variant: Variant.danger,
          });
        }
        if (responseData.messages && responseData.messages.length) {
          messages = responseData.messages;
          if (responseData.success) {
            Toaster.show({
              text: createMessage(DATASOURCE_VALID, payload.name),
              variant: Variant.success,
            });
          }
        }
        yield put({
          type: ReduxActionErrorTypes.TEST_DATASOURCE_ERROR,
          payload: { show: false, id: datasource.id, messages: messages },
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
          datasource: payload.name,
        });
        Toaster.show({
          text: createMessage(DATASOURCE_VALID, payload.name),
          variant: Variant.success,
        });
        yield put({
          type: ReduxActionTypes.TEST_DATASOURCE_SUCCESS,
          payload: { show: false, id: datasource.id, messages: [] },
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
      payload: { error, show: false },
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

function* createDatasourceFromFormSaga(
  actionPayload: ReduxAction<CreateDatasourceConfig>,
) {
  try {
    const workspaceId: string = yield select(getCurrentWorkspaceId);
    yield call(
      checkAndGetPluginFormConfigsSaga,
      actionPayload.payload.pluginId,
    );
    const formConfig: Record<string, any>[] = yield select(
      getPluginForm,
      actionPayload.payload.pluginId,
    );

    const initialValues: unknown = yield call(
      getConfigInitialValues,
      formConfig,
    );

    const payload = merge(initialValues, actionPayload.payload);
    // @ts-expect-error: isConfigured does not exists on type Payload
    payload.isConfigured = false;

    const response: ApiResponse<Datasource> = yield DatasourcesApi.createDatasource(
      {
        ...payload,
        workspaceId,
      },
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UPDATE_DATASOURCE_REFS,
        payload: response.data,
      });
      yield put({
        type: ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
        payload: response.data,
      });
      // Todo: Refactor later.
      // If we move this `put` over to QueryPaneSaga->handleDatasourceCreatedSaga, onboarding tests start failing.
      yield put(
        setDatsourceEditorMode({
          id: response.data.id,
          viewMode: false,
        }),
      );
      Toaster.show({
        text: createMessage(DATASOURCE_CREATE, response.data.name),
        variant: Variant.success,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_DATASOURCE_ERROR,
      payload: { error },
    });
  }
}

function* updateDraftsSaga() {
  const values: Record<string, unknown> = yield select(
    getFormValues(DATASOURCE_DB_FORM),
  );

  if (!values.id) return;
  const datasource: Datasource | undefined = yield select(
    getDatasource,
    // @ts-expect-error: values is of type unknown
    values.id,
  );
  if (_.isEqual(values, datasource)) {
    yield put({
      type: ReduxActionTypes.DELETE_DATASOURCE_DRAFT,
      payload: { id: values.id },
    });
  } else {
    yield put({
      type: ReduxActionTypes.UPDATE_DATASOURCE_DRAFT,
      payload: { id: values.id, draft: values },
    });
    // @ts-expect-error: values is of type unknown
    yield put(updateReplayEntity(values.id, values, ENTITY_TYPE.DATASOURCE));
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
  let data;

  if (_.isEmpty(draft)) {
    data = datasource;
  } else {
    data = draft;
  }

  yield put(initialize(DATASOURCE_DB_FORM, _.omit(data, ["name"])));
  // on reconnect modal, it shouldn't be redirected to datasource edit page
  if (shouldNotRedirect) return;
  // this redirects to the same route, so checking first.
  const datasourcePath = trimQueryString(
    datasourcesEditorIdURL({
      datasourceId: datasource.id,
    }),
  );

  if (history.location.pathname !== datasourcePath)
    history.push(
      datasourcesEditorIdURL({
        datasourceId: datasource.id,
        params: getQueryParams(),
      }),
    );
  yield put(
    // @ts-expect-error: data is of type unknown
    updateReplayEntity(data.id, _.omit(data, ["name"]), ENTITY_TYPE.DATASOURCE),
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
  if (form !== DATASOURCE_DB_FORM) return;
  if (field === "name") return;
  yield all([call(updateDraftsSaga)]);
}

function* storeAsDatasourceSaga() {
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
  const applicationId: string = yield select(getCurrentApplicationId);
  const pageId: string | undefined = yield select(getCurrentPageId);
  let datasource = _.get(values, "datasource");
  datasource = _.omit(datasource, ["name"]);
  const originalHeaders = _.get(values, "actionConfiguration.headers", []);
  const [datasourceHeaders, actionHeaders] = _.partition(
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

  _.set(
    datasource,
    "datasourceConfiguration.headers",
    filteredDatasourceHeaders,
  );

  yield put(createDatasourceFromForm(datasource));
  const createDatasourceSuccessAction: unknown = yield take(
    ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
  );
  // @ts-expect-error: createDatasourceSuccessAction is of type unknown
  const createdDatasource = createDatasourceSuccessAction.payload;

  // Update action to have this datasource
  yield put(
    setActionProperty({
      actionId: values.id,
      propertyName: "datasource",
      value: createdDatasource,
    }),
  );

  // Set datasource page to edit mode
  yield put(
    setDatsourceEditorMode({ id: createdDatasource.id, viewMode: false }),
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
  const actionRouteInfo = _.get(state, "ui.datasourcePane.actionRouteInfo");
  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = yield select(
    getGenerateCRUDEnabledPluginMap,
  );
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
        pageId: actionRouteInfo.pageId,
        apiId: actionRouteInfo.apiId,
      }),
    );
  }

  yield put({
    type: ReduxActionTypes.STORE_AS_DATASOURCE_COMPLETE,
  });
}

function* fetchDatasourceStructureSaga(
  action: ReduxAction<{ id: string; ignoreCache: boolean }>,
) {
  const datasource = shouldBeDefined<Datasource>(
    yield select(getDatasource, action.payload.id),
    `Datasource not found for id - ${action.payload.id}`,
  );

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
        AppsmithConsole.warning({
          text: "Datasource structure could not be retrieved",
          source: {
            id: action.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      } else {
        AppsmithConsole.info({
          text: "Datasource structure retrieved",
          source: {
            id: action.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_DATASOURCE_STRUCTURE_ERROR,
      payload: {
        error,
        show: false,
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
}

function* refreshDatasourceStructure(action: ReduxAction<{ id: string }>) {
  const datasource = shouldBeDefined<Datasource>(
    yield select(getDatasource, action.payload.id),
    `Datasource is not found for it - ${action.payload.id}`,
  );

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
        AppsmithConsole.warning({
          text: "Datasource structure could not be retrieved",
          source: {
            id: action.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      } else {
        AppsmithConsole.info({
          text: "Datasource structure retrieved",
          source: {
            id: action.payload.id,
            name: datasource.name,
            type: ENTITY_TYPE.DATASOURCE,
          },
        });
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.REFRESH_DATASOURCE_STRUCTURE_ERROR,
      payload: {
        error,
        show: false,
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
}

function* executeDatasourceQuerySaga(
  action: executeDatasourceQueryReduxAction<any>,
) {
  try {
    // const response: GenericApiResponse<any> = yield DatasourcesApi.executeDatasourceQuery(
    //   action.payload,
    // );
    const response: ApiResponse = yield DatasourcesApi.executeGoogleSheetsDatasourceQuery(
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.EXECUTE_DATASOURCE_QUERY_SUCCESS,
        payload: {
          // @ts-expect-error: we don't know what the response will be
          data: response.data?.trigger,
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
      // @ts-expect-error: onErrorCallback expects string
      action.onErrorCallback(error);
    }
  }
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
    takeEvery(ReduxActionTypes.UPDATE_DATASOURCE_INIT, updateDatasourceSaga),
    takeEvery(ReduxActionTypes.SAVE_DATASOURCE_NAME, saveDatasourceNameSaga),
    takeEvery(
      ReduxActionErrorTypes.SAVE_DATASOURCE_NAME_ERROR,
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
    // Intercepting the redux-form change actionType to update drafts and track change history
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_PUSH, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
  ]);
}
